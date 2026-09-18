import type { ErrorRequestHandler } from 'express';
import type { ViteDevServer } from 'vite';
import logger from '#loggers';
import problem from '#problem';

export default function mustHandleError(vite: ViteDevServer | undefined): ErrorRequestHandler {
  return (error: unknown, req, res, next) => {
    if (res.headersSent) {
      next(error);
      return;
    }

    let errorObject = new Error(String(error));
    if (error instanceof Error) {
      errorObject = error;
    }

    vite?.ssrFixStacktrace(errorObject);
    logger.error('Request failed', {
      error: errorObject.message,
      method: req.method,
      stack: errorObject.stack,
      url: req.originalUrl,
    });
    problem(req, res, 500, 'The server could not complete the request');
  };
}
