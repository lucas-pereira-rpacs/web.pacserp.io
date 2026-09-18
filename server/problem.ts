import { STATUS_CODES } from 'node:http';
import type { Request, Response } from 'express';

export default function problem(req: Request, res: Response, status: number, detail: string): void {
  res.type('application/problem+json').status(status).json({
    type: 'about:blank',
    title: STATUS_CODES[status],
    status,
    detail,
    instance: req.originalUrl,
  });
}
