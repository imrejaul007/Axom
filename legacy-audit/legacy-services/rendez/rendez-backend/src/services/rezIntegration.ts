import { Request, Response, NextFunction } from 'express';

interface ReZUser {
  id: string;
  phone: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: ReZUser;
    }
  }
}

export async function rezAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, error: 'No token' });
  }
  // Call ReZ Auth verify
  const response = await fetch(`${process.env.REZ_AUTH_URL}/auth/verify`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
  req.user = await response.json();
  next();
}
