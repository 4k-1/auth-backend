import express from 'express';
import Joi from 'joi';
import validateRequest from '../_middleware/validate.request';
import authorize from '../_middleware/authorize';
import Role from '../_helpers/role';
import accountService from './account.service';

const router = express.Router();

router.post('/authenticate', authenticateSchema, authenticate);
router.post('/refresh-token', refreshToken);
router.post('/revoke-token', authorize(), revokeTokenSchema, revokeToken);
router.post('/register', registerSchema, register);
router.post('/verify-email', verifyEmailSchema, verifyEmail);
router.post('/forgot-password', forgotPasswordSchema, forgotPassword);
router.post('/validate-reset-token', validateResetTokenSchema, validateResetToken);
router.post('/reset-password', resetPasswordSchema, resetPassword);
router.get('/', authorize([Role.Admin]), getAll);
router.get('/:id', authorize(), getById);
router.post('/', authorize([Role.Admin]), createSchema, create);
router.put('/:id', authorize(), updateSchema, update);
router.delete('/:id', authorize(), _delete);

export default router;

function setTokenCookie(res: any, token: string) {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
  });
}

// Schemas
function authenticateSchema(req: any, res: any, next: any) {
  validateRequest(req, next, Joi.object({ email: Joi.string().required(), password: Joi.string().required() }));
}
function authenticate(req: any, res: any, next: any) {
  accountService.authenticate({ ...req.body, ipAddress: req.ip })
    .then(({ refreshToken, ...account }) => { setTokenCookie(res, refreshToken); res.json(account); })
    .catch(next);
}
function refreshToken(req: any, res: any, next: any) {
  accountService.refreshToken({ token: req.cookies.refreshToken, ipAddress: req.ip })
    .then(({ refreshToken, ...account }) => { setTokenCookie(res, refreshToken); res.json(account); })
    .catch(next);
}
function revokeTokenSchema(req: any, res: any, next: any) {
  validateRequest(req, next, Joi.object({ token: Joi.string().empty('') }));
}
function revokeToken(req: any, res: any, next: any) {
  const token = req.body.token || req.cookies.refreshToken;
  if (!token) return res.status(400).json({ message: 'Token required' });
  accountService.revokeToken({ token, ipAddress: req.ip }).then(() => res.json({ message: 'Token revoked' })).catch(next);
}
function registerSchema(req: any, res: any, next: any) {
  validateRequest(req, next, Joi.object({
    title: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
    acceptTerms: Joi.boolean().valid(true).required()
  }));
}
function register(req: any, res: any, next: any) {
  accountService.register(req.body, req.get('origin')).then(() => res.json({ message: 'Registration successful, please check your email' })).catch(next);
}
function verifyEmailSchema(req: any, res: any, next: any) {
  validateRequest(req, next, Joi.object({ token: Joi.string().required() }));
}
function verifyEmail(req: any, res: any, next: any) {
  accountService.verifyEmail(req.body).then(() => res.json({ message: 'Verification successful, you can now login' })).catch(next);
}
function forgotPasswordSchema(req: any, res: any, next: any) {
  validateRequest(req, next, Joi.object({ email: Joi.string().email().required() }));
}
function forgotPassword(req: any, res: any, next: any) {
  accountService.forgotPassword({ ...req.body, origin: req.get('origin') }).then(() => res.json({ message: 'Please check your email for password reset instructions' })).catch(next);
}
function validateResetTokenSchema(req: any, res: any, next: any) {
  validateRequest(req, next, Joi.object({ token: Joi.string().required() }));
}
function validateResetToken(req: any, res: any, next: any) {
  accountService.validateResetToken(req.body).then(() => res.json({ message: 'Token is valid' })).catch(next);
}
function resetPasswordSchema(req: any, res: any, next: any) {
  validateRequest(req, next, Joi.object({ token: Joi.string().required(), password: Joi.string().min(6).required(), confirmPassword: Joi.string().valid(Joi.ref('password')).required() }));
}
function resetPassword(req: any, res: any, next: any) {
  accountService.resetPassword(req.body).then(() => res.json({ message: 'Password reset successful' })).catch(next);
}
function getAll(req: any, res: any, next: any) {
  accountService.getAll().then(accounts => res.json(accounts)).catch(next);
}
function getById(req: any, res: any, next: any) {
  if (Number(req.params.id) !== req.user.id && req.user.role !== Role.Admin) return res.status(401).json({ message: 'Unauthorized' });
  accountService.getById(req.params.id).then(account => account ? res.json(account) : res.sendStatus(404)).catch(next);
}
function createSchema(req: any, res: any, next: any) {
  validateRequest(req, next, Joi.object({
    title: Joi.string().required(),
    firstName: Joi.string().required(),
    lastName: Joi.string().required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    confirmPassword: Joi.string().optional(),
    role: Joi.string().valid(Role.Admin, Role.User).required()
  }));
}
function create(req: any, res: any, next: any) {
  accountService.create(req.body).then(account => res.json(account)).catch(next);
}
function updateSchema(req: any, res: any, next: any) {
  const schema: any = { title: Joi.string().empty(''), firstName: Joi.string().empty(''), lastName: Joi.string().empty(''), email: Joi.string().email().empty(''), password: Joi.string().min(6).empty(''), confirmPassword: Joi.string().valid(Joi.ref('password')).empty('') };
  if (req.user.role === Role.Admin) schema.role = Joi.string().valid(Role.Admin, Role.User).empty('');
  validateRequest(req, next, Joi.object(schema).with('password', 'confirmPassword'));
}
function update(req: any, res: any, next: any) {
  if (Number(req.params.id) !== req.user.id && req.user.role !== Role.Admin) return res.status(401).json({ message: 'Unauthorized' });
  accountService.update(req.params.id, req.body).then(account => res.json(account)).catch(next);
}
function _delete(req: any, res: any, next: any) {
  if (Number(req.params.id) !== req.user.id && req.user.role !== Role.Admin) return res.status(401).json({ message: 'Unauthorized' });
  accountService.delete(req.params.id).then(() => res.json({ message: 'Account deleted' })).catch(next);
}