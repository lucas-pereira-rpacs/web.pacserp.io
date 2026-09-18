import { promisify } from 'node:util';
import { createHash } from 'node:crypto';
import logger from '#loggers';
import bcrypt from 'bcrypt';
import { enqueueSendVerification } from '#jobs/sendVerification';
import { Router } from 'express';
import { z } from 'zod';
import { Permission } from '#enumerators/permission';
import { Feature } from '#enumerators/feature';
import isFeatureEnabled from '#gateways/isFeatureEnabled';
import mustBeLoggedIn from '#middlewares/mustBeLoggedIn';
import { RoleModel } from '#models/role';
import { RolePermissionModel } from '#models/rolePermission';
import { UserModel } from '#models/user';
import { UserRoleModel } from '#models/userRole';
import problem from '#problem';
import passport from '#strategies/passport';

const SALT_ROUNDS = 12;
const router = Router();

router.post('/register', async (req, res) => {
  const credentials = z
    .object({
      email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
      fullName: z.string().trim().min(1, 'Full name is required').max(100),
      phoneNumber: z.string().trim().max(50).optional(),
      locale: z.enum(['en', 'pt', 'pt-BR']).optional(),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .refine((password) => Buffer.byteLength(password, 'utf8') <= 72, {
          error: 'Password must be at most 72 bytes',
        }),
    })
    .safeParse(req.body);

  if (!credentials.success) {
    problem(req, res, 400, credentials.error.issues[0]?.message ?? 'Invalid request');
    return;
  }

  const existingUser = await UserModel.exists({ email: credentials.data.email });
  if (existingUser) {
    problem(req, res, 409, 'Email is already registered');
    return;
  }

  const user = await UserModel.create({
    email: credentials.data.email,
    fullName: credentials.data.fullName,
    phoneNumber: credentials.data.phoneNumber,
    passwordHash: await bcrypt.hash(credentials.data.password, SALT_ROUNDS),
  });

  const emailEnabled = await isFeatureEnabled(Feature.Email);

  try {
    await enqueueSendVerification(user.id, credentials.data.locale);
  } catch {
    logger.error('Verification email job enqueue failed', { userId: user.id });
  }
  res.status(201).json({
    emailVerificationRequired: emailEnabled,
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      isVerified: user.isVerified,
    },
  });
});

router.get('/verify-email', async (req, res) => {
  if (!(await isFeatureEnabled(Feature.Email))) {
    res.redirect('/login');
    return;
  }
  const input = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }).safeParse(req.query);
  if (!input.success) {
    res.redirect('/login');
    return;
  }
  const user = await UserModel.findOneAndUpdate(
    {
      verificationTokenHash: createHash('sha256').update(input.data.token).digest('hex'),
      verificationExpiresAt: { $gt: new Date() },
      isVerified: { $ne: true },
      $expr: { $eq: ['$email', '$verificationEmail'] },
    },
    {
      $set: { isVerified: true },
      $unset: {
        verificationTokenHash: 1,
        verificationExpiresAt: 1,
        verificationSentAt: 1,
        verificationEmail: 1,
      },
    },
    { returnDocument: 'after' },
  );
  if (!user) {
    res.redirect('/login');
    return;
  }

  await promisify(req.logIn.bind(req))(user);
  await promisify(req.session.save.bind(req.session))();
  res.redirect('/');
});

router.post('/verify-email', async (req, res) => {
  if (!(await isFeatureEnabled(Feature.Email))) {
    res.status(204).end();
    return;
  }
  const input = z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }).safeParse(req.body);
  if (!input.success) {
    problem(req, res, 400, 'Invalid or expired verification link');
    return;
  }
  const user = await UserModel.findOneAndUpdate(
    {
      verificationTokenHash: createHash('sha256').update(input.data.token).digest('hex'),
      verificationExpiresAt: { $gt: new Date() },
      isVerified: { $ne: true },
      $expr: { $eq: ['$email', '$verificationEmail'] },
    },
    {
      $set: { isVerified: true },
      $unset: {
        verificationTokenHash: 1,
        verificationExpiresAt: 1,
        verificationSentAt: 1,
        verificationEmail: 1,
      },
    },
  );
  if (!user) {
    problem(req, res, 400, 'Invalid or expired verification link');
    return;
  }
  res.status(204).end();
});

router.post('/resend-verification', mustBeLoggedIn, async (req, res) => {
  if (!(await isFeatureEnabled(Feature.Email))) {
    res.status(204).end();
    return;
  }
  const input = z.object({ locale: z.enum(['en', 'pt', 'pt-BR']).optional() }).safeParse(req.body);
  if (!input.success) {
    problem(req, res, 400, 'Invalid request');
    return;
  }
  if (req.user!.isVerified) {
    res.status(204).end();
    return;
  }
  try {
    await enqueueSendVerification(req.user!.id, input.data.locale);
  } catch {
    problem(req, res, 503, 'Unable to queue verification email');
    return;
  }
  res.status(204).end();
});

router.post('/login', async (req, res, next) => {
  const credentials = z
    .object({
      email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
      password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .refine((password) => Buffer.byteLength(password, 'utf8') <= 72, {
          error: 'Password must be at most 72 bytes',
        }),
    })
    .safeParse(req.body);

  if (!credentials.success) {
    problem(req, res, 400, credentials.error.issues[0]?.message ?? 'Invalid request');
    return;
  }

  req.body = credentials.data;
  const emailEnabled = await isFeatureEnabled(Feature.Email);
  passport.authenticate('local', (error: unknown, user: Express.User | false) => {
    if (error) {
      next(error);
      return;
    }

    if (!user) {
      problem(req, res, 401, 'Invalid email or password');
      return;
    }

    if (emailEnabled && !user.isVerified) {
      problem(req, res, 403, 'Verify your email');
      return;
    }

    promisify(req.logIn.bind(req))(user)
      .then(() => {
        res.json({
          user: {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            phoneNumber: user.phoneNumber,
            isVerified: user.isVerified,
          },
        });
      })
      .catch(next);
  })(req, res, next);
});

router.post('/logout', async (req, res) => {
  await promisify(req.logOut.bind(req))();
  await promisify(req.session.destroy.bind(req.session))();
  res.clearCookie('session');
  res.status(204).end();
});

router.get('/profile', mustBeLoggedIn, async (req, res) => {
  const userRoles = await UserRoleModel.find({ userId: req.user!.id }).select('roleId');
  const roleIds = userRoles.map((userRole) => userRole.roleId);
  const roles = await RoleModel.find({ _id: { $in: roleIds } }).select('name');
  let permissions = await RolePermissionModel.distinct('permission', {
    role_id: { $in: roleIds },
  });
  if (roles.some((role) => role.name === 'root')) {
    permissions = Object.values(Permission);
  }

  res.json({
    user: {
      id: req.user!.id,
      email: req.user!.email,
      fullName: req.user!.fullName,
      phoneNumber: req.user!.phoneNumber,
      isVerified: req.user!.isVerified,
      roles: roles.map((role) => role.name),
      permissions,
    },
  });
});

export default router;
