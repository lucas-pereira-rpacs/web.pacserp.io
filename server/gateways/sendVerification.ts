import { randomBytes, createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import Handlebars from 'handlebars';
import { Feature } from '#enumerators/feature';
import isFeatureEnabled from '#gateways/isFeatureEnabled';
import { UserModel } from '#models/user';

export default async function sendVerification(userId: string, locale?: string) {
  if (!(await isFeatureEnabled(Feature.Email))) return false;

  const { default: mailClient } = await import('#gateways/mailClient');
  let appUrl = process.env.APP_URL;
  let from = process.env.MAIL_FROM;
  if (process.env.NODE_ENV !== 'production') {
    appUrl ||= 'http://localhost:5173';
    from ||= 'PACS ERP <no-reply@localhost>';
  }
  if (!appUrl || !from) {
    throw new Error('APP_URL and MAIL_FROM must be set');
  }
  const verificationPage = new URL('/api/auth/verify-email', appUrl);
  if (!['http:', 'https:'].includes(verificationPage.protocol)) {
    throw new Error('APP_URL must be an HTTP or HTTPS URL');
  }

  const token = randomBytes(32).toString('hex');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const now = new Date();
  const user = await UserModel.findOneAndUpdate(
    {
      _id: userId,
      isVerified: { $ne: true },
      $or: [
        { verificationSentAt: { $exists: false } },
        { verificationSentAt: { $lte: new Date(now.getTime() - 60_000) } },
      ],
    },
    {
      $set: {
        verificationTokenHash: tokenHash,
        verificationExpiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000),
        verificationSentAt: now,
      },
    },
    { new: true },
  );
  if (!user) return false;

  try {
    await UserModel.updateOne(
      { _id: user._id, verificationTokenHash: tokenHash },
      { $set: { verificationEmail: user.email } },
    );
    let templateName = 'welcome.hbs';
    let subject = 'Welcome! Please verify your email';
    let text = 'Please verify your email using this link (valid for 24 hours):';
    if ((locale ?? process.env.DEFAULT_LOCALE)?.toLowerCase().startsWith('pt')) {
      templateName = 'welcome.pt-br.hbs';
      subject = 'Boas-vindas! Confirme seu e-mail';
      text = 'Confirme seu e-mail usando este link (válido por 24 horas):';
    }
    const template = await readFile(
      new URL(`../templates/${templateName}`, import.meta.url),
      'utf8',
    );
    const url = new URL(verificationPage);
    url.searchParams.set('token', token);
    await mailClient.sendMail({
      from,
      to: user.email,
      subject,
      html: Handlebars.compile(template)({ fullName: user.fullName, verificationUrl: url.href }),
      text: `${text}\n${url.href}`,
    });
    return true;
  } catch (error) {
    await UserModel.updateOne(
      { _id: user._id, verificationTokenHash: tokenHash },
      { $unset: { verificationTokenHash: 1, verificationExpiresAt: 1, verificationEmail: 1 } },
    );
    throw error;
  }
}
