// ~/website/src/utils/async-handler.ts

import { RequestHandler } from 'express';

export function asyncHandler<T extends object = object>(
  handler: RequestHandler<Record<string, string>, unknown, T>
): RequestHandler {
  return (req, res, next) =>
    Promise.resolve()
      .then(() => handler(req, res, next))
      .catch(next);
}
