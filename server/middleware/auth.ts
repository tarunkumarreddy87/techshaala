import type { Request, Response, NextFunction } from "express";

// Extend Express Request to include session user
declare module "express-session" {
  interface SessionData {
    userId: string;
    userRole: "student" | "teacher" | "admin";
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  console.log('Session in requireAuth:', req.session);
  console.log('Session ID:', req.sessionID);
  if (!req.session.userId) {
    console.log('Authentication failed: No userId in session');
    return res.status(401).json({ error: "Authentication required" });
  }
  console.log('Authentication successful for user:', req.session.userId);
  next();
}

export function requireRole(role: "student" | "teacher" | "admin") {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log('Session in requireRole:', req.session);
    console.log('Session ID:', req.sessionID);
    if (!req.session.userId) {
      console.log('Role check failed: No userId in session');
      return res.status(401).json({ error: "Authentication required" });
    }
    if (req.session.userRole !== role) {
      console.log('Role check failed: User role is', req.session.userRole, 'but required', role);
      return res.status(403).json({ error: `This action requires ${role} role` });
    }
    console.log('Role check successful for user:', req.session.userId, 'with role:', req.session.userRole);
    next();
  };
}