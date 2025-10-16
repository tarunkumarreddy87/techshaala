import type { Request, Response, NextFunction } from "express";

// Extend Express Request to include session user
declare module "express-session" {
  interface SessionData {
    userId: string;
    userRole: "student" | "teacher";
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

export function requireRole(role: "student" | "teacher") {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    if (req.session.userRole !== role) {
      return res.status(403).json({ error: `This action requires ${role} role` });
    }
    next();
  };
}
