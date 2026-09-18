import MongoStore from 'connect-mongo';
import session from 'express-session';

const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14;
const isProduction = process.env.NODE_ENV === 'production';
const mongoUri = process.env.MONGODB_URI;
const sessionSecret = process.env.SESSION_SECRET;

if (!mongoUri) {
  throw new Error('MONGODB_URI is not set');
}

if (!sessionSecret || sessionSecret.length < 32) {
  throw new Error('SESSION_SECRET must be at least 32 characters');
}

const mustHandleSession = session({
  name: 'session',
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: mongoUri,
    collectionName: 'sessions',
    ttl: SESSION_TTL_SECONDS,
    touchAfter: 60 * 60,
  }),
  cookie: {
    httpOnly: true,
    maxAge: SESSION_TTL_SECONDS * 1000,
    sameSite: 'lax',
    secure: isProduction,
  },
});

export default mustHandleSession;
