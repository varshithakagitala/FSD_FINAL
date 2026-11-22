import { Router, Response } from 'express';
import { Incident } from '../models/Incident';
import { User } from '../models/User';
import { ResponderProfile } from '../models/ResponderProfile';
import { AuditLog } from '../models/AuditLog';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { rankResponders } from '../services/responderRankingService';

const router = Router();

// Apply requireAuth and requireRole('admin') to all admin endpoints
router.use(requireAuth, requireRole('admin'));

// 1. Dashboard Metrics Overview
router.get('/dashboard', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const totalIncidents = await Incident.countDocuments();
    const criticalCount = await Incident.countDocuments({
      priority: 'Critical',
      status: { $ne: 'Resolved' },
    });
    const openCount = await Incident.countDocuments({ status: { $ne: 'Resolved' } });
    const resolvedCount = await Incident.countDocuments({ status: 'Resolved' });

    const categoryStats = await Incident.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
    ]);

    const statusStats = await Incident.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      metrics: {
        totalIncidents,
        criticalCount,
        openCount,
        resolvedCount,
        categoryStats,
        statusStats,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Dashboard query failed' });
  }
});

// 2. Get All Users
router.get('/users', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const users = await User.find().select('-passwordHash').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, users });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to list users' });
  }
});

// 3. Update User Status (Activate / Deactivate)
router.patch('/users/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive, role } = req.body;

    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found.' });
      return;
    }

    if (isActive !== undefined) user.isActive = Boolean(isActive);
    if (role && ['student', 'responder', 'admin'].includes(role)) user.role = role;
    await user.save();

    await AuditLog.create({
      user: req.user!._id,
      userName: req.user!.name,
      actionType: 'ADMIN_UPDATE_USER',
      entityName: 'users',
      entityId: user._id.toString(),
      ipAddress: req.ip || req.socket.remoteAddress,
      detailsJson: JSON.stringify({ targetUser: user.email, isActive, role }),
    });

    res.json({ success: true, user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Update user failed' });
  }
});

// 4. Get Audit Logs
router.get('/audit-logs', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const limit = Math.min(100, parseInt(req.query.limit as string) || 50);
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(limit);
    res.json({ success: true, count: logs.length, logs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to load audit logs' });
  }
});

// 5. Get Responders (with optional Ranking against an incident)
router.get('/responders', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const incidentId = req.query.incidentId as string;
    const profiles = await ResponderProfile.find().populate('user', 'email phoneNumber isActive');

    if (incidentId) {
      const incident = await Incident.findById(incidentId);
      if (incident) {
        const ranked = rankResponders(profiles, incident);
        res.json({ success: true, count: ranked.length, responders: ranked });
        return;
      }
    }

    res.json({ success: true, count: profiles.length, responders: profiles });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch responders' });
  }
});

export default router;
