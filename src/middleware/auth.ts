import type { Request, Response, NextFunction } from 'express';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Unauthorized. Please login.' });
  }
  next();
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  // Just adds userId to request if session exists, doesn't block
  next();
};
