import type { Job } from 'agenda';
import { Feature } from '#enumerators/feature';
import sendVerification from '#gateways/sendVerification';
import isFeatureEnabled from '#gateways/isFeatureEnabled';
import agendaClient from '#jobs/client';

const SEND_VERIFICATION_JOB = 'send-verification';

type SendVerificationData = {
  locale?: string;
  userId: string;
};

agendaClient.define(SEND_VERIFICATION_JOB, async (job: Job<SendVerificationData>) => {
  await sendVerification(job.attrs.data.userId, job.attrs.data.locale);
});

export async function enqueueSendVerification(userId: string, locale?: string) {
  if (!(await isFeatureEnabled(Feature.Email))) return;

  await agendaClient.now<SendVerificationData>(SEND_VERIFICATION_JOB, { userId, locale });
}
