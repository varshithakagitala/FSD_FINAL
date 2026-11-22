import { Request, Response, NextFunction } from 'express';
import { authService, AUTH_COOKIE_NAME } from '../services/authService';
import { User, IUser, UserRole } from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

/**
 * Authentication Middleware:
 * Inspects Authorization Bearer header or HTTP-only session cookie.
 * Looks up user in MongoDB Atlas. Rejects unauthenticated or deactivated users.
 */
export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // 1. Check Bearer token in header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Fall back to secure HTTP-only cookie
    if (!token && req.cookies && req.cookies[AUTH_COOKIE_NAME]) {
      token = req.cookies[AUTH_COOKIE_NAME];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Authentication required. Please log in to proceed.',
      });
      return;
    }

    const payload = authService.verifyToken(token);
    if (!payload || !payload.userId) {
      res.status(401).json({
        success: false,
        error: 'Invalid or expired session. Please log in again.',
      });
      return;
    }

    const user = await User.findById(payload.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User account not found.',
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: 'Your account has been deactivated by campus administration.',
      });
      return;
    }

    if (!user.isEmailVerified) {
      res.status(403).json({
        success: false,
        error: 'Email verification incomplete. Please verify your email via OTP.',
      });
      return;
    }

    req.user = user;
    next();
  } catch (err: any) {
    res.status(500).json({
      success: false,
      error: 'Authentication verification failure: ' + (err.message || 'Internal server error'),
    });
  }
}

/**
 * Server-Side Role-Based Access Control (RBAC) Middleware:
 * Verifies authenticated user holds one of the specified roles.
 * Rejects unauthorized attempts with 403 Forbidden.
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: `Access Denied: Requires one of [${allowedRoles.join(', ')}] role privileges.`,
      });
      return;
    }

    next();
  };
}
