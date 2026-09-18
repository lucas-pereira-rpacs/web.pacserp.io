import fs from 'node:fs/promises';
import express, { json } from 'express';
import mongoose from 'mongoose';
import type { ViteDevServer } from 'vite';
import logger from '#loggers';
import mustHandleError from '#middlewares/mustHandleError';
import mustHandleSession from '#middlewares/mustHandleSession';
import '#models/role';
import '#models/rolePermission';
import '#models/system';
import '#models/userRole';
import authRouter from '#routes/handlerAuth';
import publicStorageRouter from '#routes/handlerPublicStorage';
import publicSystemRouter from '#routes/handlerPublicSystem';
import systemsRouter from '#routes/handlerSystem';
import usersRouter from '#routes/handlerUsers';
import rolesRouter from '#routes/handlerRoles';
import rolePermissionsRouter from '#routes/handlerRolePermissions';
import userRolesRouter from '#routes/handlerUserRoles';
import seed from './seed.ts';
import passport from '#strategies/passport';
import mustBeLoggedIn from '#middlewares/mustBeLoggedIn';
import agendaClient from '#jobs/client';
import '#jobs/sendVerification';

type RenderResult = {
  head?: string;
  html?: string;
};

type Render = (url: string) => RenderResult | Promise<RenderResult>;

const isProduction = process.env.NODE_ENV === 'production';
const port = process.env.PORT || 5173;
const base = process.env.BASE || '/';
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  throw new Error('MONGODB_URI is not set');
}

await mongoose.connect(mongoUri);
if (mongoose.connection.readyState !== 1) {
  throw new Error('Database is not connected');
}
logger.info('Connected to MongoDB');
await seed();
await agendaClient.start();
logger.info('Agenda started');

let templateHtml = '';
if (isProduction) {
  templateHtml = await fs.readFile('./dist/client/index.html', 'utf-8');
}
const app = express();

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(json({ limit: '16kb' }));
app.use(mustHandleSession);
app.use(passport.initialize());
app.use(passport.session());
app.use('/api/auth', authRouter);
app.use('/api/public/storage', publicStorageRouter);
app.use('/api/public/system', publicSystemRouter);
app.use('/api/system', systemsRouter);
app.use('/api/users', usersRouter);
app.use('/api/roles', rolesRouter);
app.use('/api/roles-permissions', rolePermissionsRouter);
app.use('/api/user-roles', userRolesRouter);

let vite: ViteDevServer | undefined;
if (!isProduction) {
  const { createServer } = await import('vite');
  vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
    base,
  });
  app.use(vite.middlewares);
}

if (isProduction) {
  const compression = (await import('compression')).default;
  const sirv = (await import('sirv')).default;
  app.use(compression());
  app.use(base, sirv('./dist/client', { extensions: [] }));
}

app.get('*all', mustBeLoggedIn);

app.use('*all', async (req, res, next) => {
  if (req.method !== 'GET' || !req.accepts('html')) {
    return next();
  }

  let url = req.originalUrl;
  if (base !== '/' && url.startsWith(base)) {
    url = `/${url.slice(base.length)}`;
  }

  if (isProduction) {
    const productionEntry = '../dist/server/entry-server.js';
    const render = (await import(productionEntry)).render as Render;
    const rendered = await render(url);
    const html = templateHtml
      .replace(`<!--app-head-->`, rendered.head ?? '')
      .replace(`<!--app-html-->`, rendered.html ?? '');

    res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
    return;
  }

  const developmentServer = vite;
  if (!developmentServer) {
    throw new Error('Vite development server is not initialized');
  }

  let template = await fs.readFile('./index.html', 'utf-8');
  template = await developmentServer.transformIndexHtml(url, template);
  const render = (await developmentServer.ssrLoadModule('/client/entry-server.tsx'))
    .render as Render;
  const rendered = await render(url);
  const html = template
    .replace(`<!--app-head-->`, rendered.head ?? '')
    .replace(`<!--app-html-->`, rendered.html ?? '');

  res.status(200).set({ 'Content-Type': 'text/html' }).send(html);
});

app.use(mustHandleError(vite));

app.listen(port, () => {
  logger.info('Server started', { url: `http://localhost:${port}` });
});
