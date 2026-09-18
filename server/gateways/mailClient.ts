import nodemailer from 'nodemailer';

let host = process.env.SMTP_HOST;
let port = Number(process.env.SMTP_PORT);

if (process.env.NODE_ENV !== 'production') {
  host ||= '127.0.0.1';
  port ||= 1025;
}

if (!host) {
  throw new Error('SMTP_HOST is not set');
}

if (!port) {
  throw new Error('SMTP_PORT is not set');
}

let auth: { user: string; pass: string } | undefined;
if (process.env.SMTP_USER && process.env.SMTP_PASSWORD) {
  auth = {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  };
}

const mailClient = nodemailer.createTransport({
  host,
  port,
  secure: process.env.SMTP_SECURE === 'true',
  auth,
});

export default mailClient;
