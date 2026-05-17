const express = require('express');
const router = express.Router();
const { register, verifyEmail, login, refreshToken, logout, forgotPassword, resetPassword } = require('../controllers/authController');

/**
 * @swagger
 * /accounts/register:
 *   post:
 *     summary: Register a new account
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email, password, confirmPassword, acceptTerms]
 *             properties:
 *               firstName: { type: string }
 *               lastName: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               confirmPassword: { type: string }
 *               acceptTerms: { type: boolean }
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error or email already exists
 */
router.post('/register', register);

/**
 * @swagger
 * /accounts/verify-email:
 *   post:
 *     summary: Verify email with token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token]
 *             properties:
 *               token: { type: string }
 *     responses:
 *       200:
 *         description: Email verified
 *       400:
 *         description: Invalid or expired token
 */
router.post('/verify-email', verifyEmail);

/**
 * @swagger
 * /accounts/authenticate:
 *   post:
 *     summary: Login and get JWT token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200:
 *         description: Login successful with JWT token
 *       401:
 *         description: Invalid credentials
 */
router.post('/authenticate', login);

/**
 * @swagger
 * /accounts/refresh-token:
 *   post:
 *     summary: Get new JWT using refresh token cookie
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: New JWT issued
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh-token', refreshToken);

/**
 * @swagger
 * /accounts/revoke-token:
 *   post:
 *     summary: Logout and revoke refresh token
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post('/revoke-token', logout);

/**
 * @swagger
 * /accounts/forgot-password:
 *   post:
 *     summary: Request a password reset email
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email: { type: string }
 *     responses:
 *       200:
 *         description: Reset email sent (or silently ignored if email not found)
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /accounts/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, password, confirmPassword]
 *             properties:
 *               token: { type: string }
 *               password: { type: string }
 *               confirmPassword: { type: string }
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
router.post('/reset-password', resetPassword);

module.exports = router;
