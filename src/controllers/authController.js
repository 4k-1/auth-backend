const db = require('../config/database').pool;
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
const { generateJwtToken, generateRefreshToken, refreshTokenExists, revokeRefreshToken, revokeAllUserTokens } = require('../utils/jwt');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../utils/email');

function setRefreshTokenCookie(res, token) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

async function register(req, res) {
  try {
    const { firstName, lastName, email, password, acceptTerms } = req.body;

    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!acceptTerms || acceptTerms === false || acceptTerms === 'false') {
      return res.status(400).json({ message: 'You must accept the terms and conditions' });
    }

    const [existing] = await pool.execute('SELECT id FROM accounts WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [allAccounts] = await pool.execute('SELECT COUNT(*) as count FROM accounts');
    const role = allAccounts[0].count === 0 ? 'Admin' : 'User';

    const verificationToken = uuidv4();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await pool.execute(
      `INSERT INTO accounts (first_name, last_name, email, password_hash, role, verification_token, verification_token_expires)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [firstName, lastName, email, passwordHash, role, verificationToken, verificationExpires]
    );

    let emailPreviewUrl = null;
    try {
      const emailResult = await sendVerificationEmail(email, firstName, verificationToken);
      emailPreviewUrl = emailResult.previewUrl;
      console.log('✅ Verification email sent to:', email);
      if (emailPreviewUrl) console.log('📧 Preview URL:', emailPreviewUrl);
    } catch (emailErr) {
      console.error('⚠️  Email send failed (registration still succeeded):', emailErr.message);
    }

    return res.status(201).json({
      message: 'Registration successful. Please check your email to verify your account.',
      role,
      emailPreviewUrl,
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ message: 'Registration failed: ' + error.message });
  }
}

async function verifyEmail(req, res) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ message: 'Verification token is required' });
    }

    const [rows] = await pool.execute(
      'SELECT * FROM accounts WHERE verification_token = ? AND verification_token_expires > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired verification token' });
    }

    await pool.execute(
      'UPDATE accounts SET is_verified = TRUE, verification_token = NULL, verification_token_expires = NULL WHERE id = ?',
      [rows[0].id]
    );

    return res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ message: 'Verification failed: ' + error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const [rows] = await pool.execute('SELECT * FROM accounts WHERE email = ?', [email]);
    const account = rows[0];

    if (!account) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (!account.is_verified) {
      return res.status(401).json({ message: 'Please verify your email before logging in' });
    }

    const validPassword = await bcrypt.compare(password, account.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const jwtToken = generateJwtToken(account);
    const refreshToken = await generateRefreshToken(account.id, req.ip);

    setRefreshTokenCookie(res, refreshToken);

    return res.json({
      id: account.id,
      firstName: account.first_name,
      lastName: account.last_name,
      email: account.email,
      role: account.role,
      jwtToken,
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Login failed: ' + error.message });
  }
}

async function refreshToken(req, res) {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    const existingToken = await refreshTokenExists(token);

    if (!existingToken) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    if (existingToken.revoked_at || new Date(existingToken.expires) < new Date()) {
      return res.status(401).json({ message: 'Refresh token expired or revoked' });
    }

    const newRefreshToken = await generateRefreshToken(existingToken.account_id, req.ip);
    await revokeRefreshToken(token, newRefreshToken);

    const account = {
      id: existingToken.account_id,
      email: existingToken.email,
      role: existingToken.role,
    };

    const jwtToken = generateJwtToken(account);
    setRefreshTokenCookie(res, newRefreshToken);

    return res.json({
      id: existingToken.account_id,
      firstName: existingToken.first_name,
      lastName: existingToken.last_name,
      email: existingToken.email,
      role: existingToken.role,
      jwtToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ message: 'Token refresh failed: ' + error.message });
  }
}

async function logout(req, res) {
  try {
    const token = req.cookies.refreshToken;
    if (token) {
      await revokeRefreshToken(token);
    }
    res.clearCookie('refreshToken');
    return res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Logout failed' });
  }
}

async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    const [rows] = await pool.execute('SELECT * FROM accounts WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const account = rows[0];
    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    await pool.execute(
      'UPDATE accounts SET reset_token = ?, reset_token_expires = ? WHERE id = ?',
      [resetToken, resetExpires, account.id]
    );

    try {
      await sendPasswordResetEmail(email, account.first_name, resetToken);
    } catch (emailErr) {
      console.error('Reset email failed:', emailErr.message);
    }

    return res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Request failed' });
  }
}

async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;

    const [rows] = await pool.execute(
      'SELECT * FROM accounts WHERE reset_token = ? AND reset_token_expires > NOW()',
      [token]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired reset token' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.execute(
      'UPDATE accounts SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?',
      [passwordHash, rows[0].id]
    );

    await revokeAllUserTokens(rows[0].id);

    return res.json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Password reset failed' });
  }
}

module.exports = { register, verifyEmail, login, refreshToken, logout, forgotPassword, resetPassword };