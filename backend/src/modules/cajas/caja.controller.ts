import type { NextFunction, Request, Response } from 'express';

import {
  abrirCajaDiaria,
  cerrarCajaDiaria,
  getCajaDiaria,
  getCajaGeneral,
  registrarSalidaCajaGeneral,
  trasladarDesdeCajaDiaria,
} from './caja.service';
import {
  parseAperturaCajaPayload,
  parseCierreCajaPayload,
  parseSalidaCajaGeneralPayload,
  parseTrasladoCajaGeneralPayload,
} from './caja.schemas';

export async function getCajaDiariaActual(req: Request, res: Response, next: NextFunction) {
  try {
    const fecha = typeof req.query.fecha === 'string' ? req.query.fecha : undefined;
    res.json(await getCajaDiaria(fecha));
  } catch (error) {
    next(error);
  }
}

export async function postAperturaCajaDiaria(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(
      await abrirCajaDiaria(parseAperturaCajaPayload(req.body || {}), req.authUser?.id)
    );
  } catch (error) {
    next(error);
  }
}

export async function postCierreCajaDiaria(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await cerrarCajaDiaria(parseCierreCajaPayload(req.body || {}), req.authUser?.id));
  } catch (error) {
    next(error);
  }
}

export async function getCajaGeneralActual(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await getCajaGeneral());
  } catch (error) {
    next(error);
  }
}

export async function postTrasladoCajaGeneral(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(
      await trasladarDesdeCajaDiaria(
        parseTrasladoCajaGeneralPayload(req.body || {}),
        req.authUser?.id
      )
    );
  } catch (error) {
    next(error);
  }
}

export async function postSalidaCajaGeneral(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(
      await registrarSalidaCajaGeneral(parseSalidaCajaGeneralPayload(req.body || {}), req.authUser?.id)
    );
  } catch (error) {
    next(error);
  }
}
