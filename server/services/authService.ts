import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Response } from 'express';
import { IUser } from '../models/User';

const BCRYPT_ROUNDS = 12;
const JWT_EXPIRES_IN = '24h';
export const AUTH_COOKIE_NAME = 'rescuegrid_token';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
}

export class AuthService {
  private jwtSecret: string;

  constructor() {
    const configured = process.env.JWT_SECRET?.trim();
    if (configured && !configured.includes('your_') && !configured.includes('placeholder')) {
      this.jwtSecret = configured;
    } else {
      // Generate a cryptographically secure 512-bit (64-byte) secret at runtime if not provided
      this.jwtSecret = crypto.randomBytes(64).toString('hex');
      console.warn(
        '[RescueGrid Security] JWT_SECRET was not provided or was a placeholder. Generated cryptographically secure 512-bit secret for this runtime instance using crypto.randomBytes.'
      );
    }
  }

  public async hashPassword(password: string): Promise<string> {
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long');
    }
    return bcrypt.hash(password, BCRYPT_ROUNDS);
  }

  public async comparePassword(plain: string, hash: string): Promise<boolean> {
    if (!plain || !hash) return false;
    return bcrypt.compare(plain, hash);
  }

  public generateToken(user: IUser): string {
    const payload: JwtPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      name: user.name,
    };

    return jwt.sign(payload, this.jwtSecret, {
      expiresIn: JWT_EXPIRES_IN,
    });
  }

  public verifyToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, this.jwtSecret) as JwtPayload;
    } catch {
      return null;
    }
  }

  public setAuthCookie(res: Response, token: string): void {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: '/',
    });
  }

  public clearAuthCookie(res: Response): void {
    res.clearCookie(AUTH_COOKIE_NAME, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
  }
}

export const authService = new AuthService();
