const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../config/database');
require('dotenv').config();

function generateJwtToken(account) {
  return jwt.sign(
    {
      sub: account.id,
      id: account.id,
      role: account.role,
      email: account.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );
}

async function generateRefreshToken(accountId, ipAddress) {
  const token = uuidv4();
  const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await pool.execute(
    'INSERT INTO refresh_tokens (account_id, token, expires) VALUES (?, ?, ?)',
    [accountId, token, expires]
  );

  return token;
}

async function refreshTokenExists(token) {
  const [rows] = await pool.execute(
    'SELECT rt.*, a.id as account_id, a.email, a.role, a.first_name, a.last_name, a.is_verified FROM refresh_tokens rt JOIN accounts a ON rt.account_id = a.id WHERE rt.token = ?',
    [token]
  );
  return rows[0] || null;
}

async function revokeRefreshToken(token, replacedByToken = null) {
  await pool.execute(
    'UPDATE refresh_tokens SET revoked_at = NOW(), replaced_by_token = ? WHERE token = ?',
    [replacedByToken, token]
  );
}

async function revokeAllUserTokens(accountId) {
  await pool.execute(
    'UPDATE refresh_tokens SET revoked_at = NOW() WHERE account_id = ? AND revoked_at IS NULL',
    [accountId]
  );
}

function verifyJwtToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = {
  generateJwtToken,
  generateRefreshToken,
  refreshTokenExists,
  revokeRefreshToken,
  revokeAllUserTokens,
  verifyJwtToken,
};
