import { Router, Request, Response } from 'express';
import { User } from '../models/User';
import { AuditLog } from '../models/AuditLog';
import { ResponderProfile } from '../models/ResponderProfile';
import { authService } from '../services/authService';
import { otpService } from '../services/otpService';
import { emailService } from '../services/emailService';
import { requireAuth, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// 1. Signup (Student / Responder / Admin)
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password, role, studentId, badgeNumber, specialization, department, phoneNumber } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'Full name, email, and password are required.' });
      return;
    }

    // Only allow known roles; default to student
    const allowedRoles = ['student', 'responder', 'admin'];
    const assignedRole: 'student' | 'responder' | 'admin' = allowedRoles.includes(role?.toLowerCase())
      ? role.toLowerCase()
      : 'student';

    const normalizedEmail = email.trim().toLowerCase();

    // Check duplicate verified email
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser && existingUser.isEmailVerified) {
      res.status(409).json({
        success: false,
        error: 'An account with this email address already exists. Please log in.',
      });
      return;
    }

    const passwordHash = await authService.hashPassword(password);

    // Create or update unverified record
    let user = existingUser;
    if (user) {
      user.name = name.trim();
      user.passwordHash = passwordHash;
      user.role = assignedRole;
      user.studentId = studentId?.trim();
      user.department = department?.trim();
      user.phoneNumber = phoneNumber?.trim();
      await user.save();
    } else {
      user = await User.create({
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: assignedRole,
        studentId: studentId?.trim(),
        department: department?.trim(),
        phoneNumber: phoneNumber?.trim(),
        isEmailVerified: false,
        isActive: true,
      });
    }

    // Generate & hash 6-digit OTP
    const { otpCode, expiresAt } = await otpService.generateAndSaveOtp(normalizedEmail, 'signup');

    // Deliver through real SMTP Nodemailer
    const emailResult = await emailService.sendSignupOtp(normalizedEmail, user.name, otpCode);

    if (!emailResult.success) {
      res.status(502).json({
        success: false,
        error: `Failed to deliver verification email via Gmail SMTP: ${emailResult.error || 'SMTP delivery failed'}. Please configure SMTP_USER and SMTP_PASS in the backend environment.`,
      });
      return;
    }

    res.status(201).json({
      success: true,
      message: `Registration initiated as ${assignedRole}. A 6-digit OTP has been dispatched to your email.`,
      email: normalizedEmail,
      role: assignedRole,
      expiresAt,
    });
  } catch (err: any) {
    console.error('[RescueGrid Signup Error]:', err);
    res.status(400).json({ success: false, error: err.message || 'Registration failed' });
  }
});


// 2. Verify Signup OTP
router.post('/verify-signup-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      res.status(400).json({ success: false, error: 'Email and 6-digit OTP code are required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const verification = await otpService.verifyOtp(normalizedEmail, 'signup', otpCode);
    if (!verification.success) {
      res.status(400).json(verification);
      return;
    }

    const user = await User.findOneAndUpdate(
      { email: normalizedEmail },
      { isEmailVerified: true, isActive: true },
      { new: true }
    );

    if (!user) {
      res.status(404).json({ success: false, error: 'User record not found.' });
      return;
    }

    // If role is responder, auto-create a ResponderProfile
    if (user.role === 'responder') {
      const exists = await ResponderProfile.findOne({ user: user._id });
      if (!exists) {
        await ResponderProfile.create({
          user: user._id,
          fullName: user.name,
          badgeNumber: `RESP-${Date.now().toString().slice(-5)}`,
          specialization: 'General',
          currentStatus: 'Available',
          campusBaseZone: user.department || 'Campus HQ',
          activeIncidentsCount: 0,
        });
      }
    }

    // Audit log
    await AuditLog.create({
      user: user._id,
      userName: user.name,
      actionType: 'SIGNUP_EMAIL_VERIFIED',
      entityName: 'users',
      entityId: user._id.toString(),
      ipAddress: req.ip || req.socket.remoteAddress,
      detailsJson: JSON.stringify({ email: normalizedEmail, role: user.role }),
    });

    res.json({
      success: true,
      message: 'Email verified successfully! You may now sign in with your credentials.',
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Verification failure' });
  }
});

// 3. Resend OTP
router.post('/resend-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, purpose } = req.body;
    if (!email || !purpose || (purpose !== 'signup' && purpose !== 'login')) {
      res.status(400).json({ success: false, error: 'Valid email and purpose (signup/login) required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    const { otpCode } = await otpService.generateAndSaveOtp(normalizedEmail, purpose);

    let emailResult;
    if (purpose === 'signup') {
      emailResult = await emailService.sendSignupOtp(normalizedEmail, user.name, otpCode);
    } else {
      emailResult = await emailService.sendLoginOtp(normalizedEmail, user.name, otpCode);
    }

    if (!emailResult.success) {
      res.status(502).json({
        success: false,
        error: `Failed to deliver OTP via Gmail SMTP: ${emailResult.error || 'SMTP delivery failure'}. Please verify your SMTP settings.`,
      });
      return;
    }

    res.json({
      success: true,
      message: `A fresh 6-digit code has been dispatched to ${normalizedEmail}.`,
    });
  } catch (err: any) {
    res.status(429).json({ success: false, error: err.message || 'Resend cooldown in effect.' });
  }
});

// 4. Two-Step Login (Step 1: Check credentials -> Send Login OTP)
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Prevent user enumeration: generic error message
    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid email address or password.' });
      return;
    }

    const isMatch = await authService.comparePassword(password, user.passwordHash);
    if (!isMatch) {
      res.status(401).json({ success: false, error: 'Invalid email address or password.' });
      return;
    }

    if (!user.isEmailVerified) {
      res.status(403).json({
        success: false,
        unverified: true,
        email: normalizedEmail,
        error: 'Your account email has not been verified yet. Please complete OTP verification.',
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

    // Step 2 Login: Issue fresh 6-digit login OTP
    const { otpCode, expiresAt } = await otpService.generateAndSaveOtp(normalizedEmail, 'login');
    const emailResult = await emailService.sendLoginOtp(normalizedEmail, user.name, otpCode);

    if (!emailResult.success) {
      res.status(502).json({
        success: false,
        error: `Failed to deliver login verification OTP via Gmail SMTP: ${emailResult.error || 'SMTP delivery failure'}. Please verify your SMTP_USER and SMTP_PASS environment variables.`,
      });
      return;
    }

    res.json({
      success: true,
      step: 'otp_required',
      message: 'Credentials valid. Two-step verification code sent to your registered email.',
      email: normalizedEmail,
      expiresAt,
    });
  } catch (err: any) {
    console.error('[RescueGrid Login Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Login failed' });
  }
});

// Test / Verify SMTP Connectivity
router.get('/smtp-check', async (req: Request, res: Response): Promise<void> => {
  const result = await emailService.verifyConnection();
  res.status(result.success ? 200 : 503).json(result);
});

// 5. Two-Step Login (Step 2: Verify Login OTP -> Issue JWT & Cookie)
router.post('/verify-login-otp', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otpCode } = req.body;

    if (!email || !otpCode) {
      res.status(400).json({ success: false, error: 'Email and 6-digit OTP code are required.' });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    const verification = await otpService.verifyOtp(normalizedEmail, 'login', otpCode);
    if (!verification.success) {
      res.status(400).json(verification);
      return;
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !user.isActive) {
      res.status(401).json({ success: false, error: 'User account invalid or inactive.' });
      return;
    }

    // Generate authenticated JWT
    const token = authService.generateToken(user);
    authService.setAuthCookie(res, token);

    // Security Audit Log
    await AuditLog.create({
      user: user._id,
      userName: user.name,
      actionType: 'LOGIN_2FA_SUCCESS',
      entityName: 'users',
      entityId: user._id.toString(),
      ipAddress: req.ip || req.socket.remoteAddress,
      detailsJson: JSON.stringify({ email: normalizedEmail, role: user.role }),
    });

    res.json({
      success: true,
      message: 'Authenticated successfully.',
      token,
      user,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'OTP verification failed' });
  }
});

// 6. Logout
router.post('/logout', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (req.user) {
      await AuditLog.create({
        user: req.user._id,
        userName: req.user.name,
        actionType: 'LOGOUT',
        entityName: 'users',
        entityId: req.user._id.toString(),
        ipAddress: req.ip || req.socket.remoteAddress,
      });
    }

    authService.clearAuthCookie(res);
    res.json({ success: true, message: 'Signed out successfully.' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Logout error' });
  }
});

// 7. Get Current Authenticated User
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  res.json({ success: true, user: req.user });
});

export default router;
