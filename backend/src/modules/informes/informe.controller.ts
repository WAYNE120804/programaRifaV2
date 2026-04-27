import type { NextFunction, Request, Response } from 'express';

import { getInformeAdministrativo, parseInformeFilters } from './informe.service';

export async function getInformeGeneral(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getInformeAdministrativo(parseInformeFilters(req.query)));
  } catch (error) {
    next(error);
  }
}
