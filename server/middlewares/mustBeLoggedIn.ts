import type { RequestHandler } from 'express';
import problem from '#problem';

const publicRoutes = new Set(['/login', '/register']);

const mustBeLoggedIn: RequestHandler = (req, res, next) => {
  const isPublicPage = publicRoutes.has(req.path);
  const isApiRequest = req.originalUrl.startsWith('/api/');

  if (isPublicPage) {
    return next();
  }

  if (req.isAuthenticated()) {
    return next();
  }

  if (!isApiRequest) {
    return res.redirect('/login');
  }

  problem(req, res, 401, 'Not authenticated');
};

export default mustBeLoggedIn;
