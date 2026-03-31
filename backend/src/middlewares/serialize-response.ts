import type { NextFunction, Request, Response } from 'express';

import { serializeData } from '../utils/serialize';

type JsonResponse = Response['json'];

export function serializeResponse(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  const originalJson = res.json.bind(res) as JsonResponse;

  res.json = ((payload: unknown) => originalJson(serializeData(payload))) as JsonResponse;

  next();
}
