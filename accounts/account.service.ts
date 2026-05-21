import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { Op } from 'sequelize';
import db from '../_helpers/db';
import Role from '../_helpers/role';
import sendEmail from '../_helpers/send-email';

const JWT_SECRET = process.env.JWT_SECRET || 'secret';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:4200';

function randomTokenString() {
  return crypto.randomBytes(40).toString('hex');
}

async function hashPassword(password: string) {
  return await bcrypt.hash(password, 10);
}

function basicDetails(account: any) {
  const { id, title, firstName, lastName, email, role, created, updated, verified } = account;
  return { id, title, firstName, lastName, email, role, created, updated, isVerified: !!verified };
}

async function getAccount(id: number) {
  const account = await db.Account.findByPk(id);
  if (!account) throw 'Account not found';
  return account;
}

async function getRefreshToken(token: string) {
  const refreshToken = await db.RefreshToken.findOne({ where: { token } });
  if (!refreshToken || !refreshToken.isActive) throw 'Invalid token';
  return refreshToken;
}

export default {
  authenticate,
  refreshToken,
  revokeToken,
  register,
  verifyEmail,
  forgotPassword,
  validateResetToken,
  resetPassword,
  getAll,
  getById,
  create,
  update,
  delete: _delete
};

// ✅ FIXED: Use passwordHash column (not password)
async function authenticate({ email, password, ipAddress }: any) {
  const account = await db.Account.scope('withHash').findOne({ where: { email } });
  if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
    throw 'Email or password is incorrect';
  }
  if (!account.verified) throw 'Please verify your email before logging in';

  const jwtToken = generateJwtToken(account);
  const refreshToken = generateRefreshToken(account, ipAddress);
  await refreshToken.save();

  return { ...basicDetails(account), jwtToken, refreshToken: refreshToken.token };
}

function generateJwtToken(account: any) {
  return jwt.sign({ id: account.id, role: account.role }, JWT_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken(account: any, ipAddress: string) {
  return db.RefreshToken.build({
    accountId: account.id,
    token: randomTokenString(),
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    created: new Date(),
    createdByIp: ipAddress
  });
}

async function refreshToken({ token, ipAddress }: any) {
  const refreshToken = await getRefreshToken(token);
  const account = await refreshToken.getAccount();

  const newRefreshToken = generateRefreshToken(account, ipAddress);
  refreshToken.revoked = new Date();
  refreshToken.revokedByIp = ipAddress;
  refreshToken.replacedByToken = newRefreshToken.token;

  await refreshToken.save();
  await newRefreshToken.save();

  const jwtToken = generateJwtToken(account);
  return { ...basicDetails(account), jwtToken, refreshToken: newRefreshToken.token };
}

async function revokeToken({ token, ipAddress }: any) {
  const refreshToken = await getRefreshToken(token);
  refreshToken.revoked = new Date();
  refreshToken.revokedByIp = ipAddress;
  await refreshToken.save();
}

// ✅ FIXED: Use passwordHash column (not password)
async function register(params: any, origin: string) {
  if (await db.Account.findOne({ where: { email: params.email } })) {
    throw 'Email already registered';
  }

  const account = db.Account.build(params);
  const isFirstAccount = (await db.Account.count()) === 0;
  account.role = isFirstAccount ? Role.Admin : Role.User;
  account.verificationToken = randomTokenString();
  account.passwordHash = await hashPassword(params.password);  // ✅ Changed to passwordHash

  await account.save();

  const verificationUrl = `${FRONTEND_URL}/account/verify-email?token=${account.verificationToken}`;
  
  await sendEmail({
    to: params.email,
    subject: 'Verify Your Email',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Verify Your Email</title>
      </head>
      <body>
        <h3>Verify Email</h3>
        <p>Thanks for registering!</p>
        <p>Please click the link below to verify your email address:</p>
        <p>${verificationUrl}</p>
      </body>
      </html>
    `
  });
}

async function verifyEmail({ token }: any) {
  const account = await db.Account.findOne({ where: { verificationToken: token } });
  if (!account) throw 'Verification failed';
  account.verified = new Date();
  account.verificationToken = null;
  await account.save();
}

async function forgotPassword({ email }: any) {
  const account = await db.Account.findOne({ where: { email } });
  if (!account) return;

  account.resetToken = randomTokenString();
  account.resetTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await account.save();

  const resetUrl = `${FRONTEND_URL}/account/reset-password?token=${account.resetToken}`;
  
  await sendEmail({
    to: email,
    subject: 'Reset Your Password',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Reset Password</title>
      </head>
      <body>
        <h3>Reset Password</h3>
        <p>Hello <strong>${account.firstName}</strong>,</p>
        <p>We received a request to reset your password. Click the link below to create a new password:</p>
        <p>${resetUrl}</p>
        <p>This link will expire in 24 hours.</p>
        <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
      </body>
      </html>
    `
});
}

async function validateResetToken({ token }: any) {
  const account = await db.Account.findOne({
    where: { resetToken: token, resetTokenExpires: { [Op.gt]: new Date() } }
  });
  if (!account) throw 'Invalid token';
  return account;
}

// ✅ FIXED: Use passwordHash column (not password)
async function resetPassword({ token, password }: any) {
  const account = await validateResetToken({ token });
  account.passwordHash = await hashPassword(password);  // ✅ Changed to passwordHash
  account.passwordReset = new Date();
  account.resetToken = null;
  await account.save();
}

async function getAll() {
  const accounts = await db.Account.findAll();
  return accounts.map(basicDetails);
}

async function getById(id: number) {
  const account = await getAccount(id);
  return basicDetails(account);
}

// ✅ FIXED: Use passwordHash column (not password)
async function create(params: any) {
  if (await db.Account.findOne({ where: { email: params.email } })) {
    throw 'Email already registered';
  }
  const account = db.Account.build(params);
  account.verified = new Date();
  account.passwordHash = await hashPassword(params.password);  // ✅ Changed to passwordHash
  await account.save();
  return basicDetails(account);
}

// ✅ FIXED: Use passwordHash column (not password)
async function update(id: number, params: any) {
  const account = await getAccount(id);
  if (params.password) {
    params.passwordHash = await hashPassword(params.password);  // ✅ Changed to passwordHash
    delete params.password;
  }
  Object.assign(account, params);
  account.updated = new Date();
  await account.save();
  return basicDetails(account);
}

async function _delete(id: number) {
  const account = await getAccount(id);
  await account.destroy();
}