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
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #4F46E5, #7C3AED); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { font-size: 12px; color: #6B7280; margin-top: 30px; text-align: center; }
          .code { background: #e5e7eb; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Auth System!</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${params.firstName}</strong>,</p>
            <p>Thank you for registering! Please verify your email address to complete your account setup.</p>
            <div style="text-align: center;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p class="code">${verificationUrl}</p>
            <p><strong>This link will expire in 24 hours.</strong></p>
            <div class="footer">
              <p>If you didn't create an account, please ignore this email.</p>
              <hr>
              <p>&copy; ${new Date().getFullYear()} Auth System. All rights reserved.</p>
            </div>
          </div>
        </div>
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
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #EF4444, #DC2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; padding: 12px 24px; background-color: #EF4444; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
          .footer { font-size: 12px; color: #6B7280; margin-top: 30px; text-align: center; }
          .warning { background: #FEF3C7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          .code { background: #e5e7eb; padding: 10px; border-radius: 5px; font-family: monospace; word-break: break-all; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reset Your Password</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${account.firstName}</strong>,</p>
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            <div style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            <p>Or copy and paste this link into your browser:</p>
            <p class="code">${resetUrl}</p>
            <div class="warning">
              <p><strong>⚠️ This link will expire in 24 hours.</strong></p>
              <p>If you didn't request this, please ignore this email and your password will remain unchanged.</p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Auth System. All rights reserved.</p>
            </div>
          </div>
        </div>
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