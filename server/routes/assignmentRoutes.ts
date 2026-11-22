import { Router, Response } from 'express';
import { IncidentAssignment } from '../models/IncidentAssignment';
import { Incident } from '../models/Incident';
import { ResponderProfile } from '../models/ResponderProfile';
import { IncidentUpdate } from '../models/IncidentUpdate';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { User } from '../models/User';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';

const router = Router();

// 1. Dispatch / Assign Responder (Admin Only)
router.post('/', requireAuth, requireRole('admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { incidentId, responderUserId, notes } = req.body;

    if (!incidentId || !responderUserId) {
      res.status(400).json({ success: false, error: 'incidentId and responderUserId are required.' });
      return;
    }

    const incident = await Incident.findById(incidentId);
    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident not found.' });
      return;
    }

    const responderUser = await User.findById(responderUserId);
    const responderProfile = await ResponderProfile.findOne({ user: responderUserId });

    if (!responderUser || !responderProfile) {
      res.status(404).json({ success: false, error: 'Responder profile not found.' });
      return;
    }

    // Create assignment record
    const assignment = await IncidentAssignment.create({
      incident: incident._id,
      responder: responderUser._id,
      assignedByAdmin: req.user!._id,
      status: 'Pending',
      assignmentNotes: notes?.trim() || 'Dispatched by Operations Command.',
    });

    // Update incident
    const previousStatus = incident.status;
    incident.assignedResponder = responderUser._id;
    incident.assignedResponderName = responderProfile.fullName;
    incident.assignedResponderBadge = responderProfile.badgeNumber;
    if (incident.status === 'Reported') {
      incident.status = 'Assigned';
    }
    await incident.save();

    // Update responder workload
    responderProfile.activeIncidentsCount += 1;
    responderProfile.currentStatus = 'Busy';
    await responderProfile.save();

    // Timeline entry
    await IncidentUpdate.create({
      incident: incident._id,
      updatedByUser: req.user!._id,
      updaterName: req.user!.name,
      updaterRole: 'admin',
      statusBefore: previousStatus,
      statusAfter: incident.status,
      noteText: `Assigned to ${responderProfile.fullName} (${responderProfile.badgeNumber}) by Operations Command.`,
    });

    // Audit log
    await AuditLog.create({
      user: req.user!._id,
      userName: req.user!.name,
      actionType: 'ADMIN_DISPATCH',
      entityName: 'incident_assignments',
      entityId: assignment._id.toString(),
      ipAddress: req.ip || req.socket.remoteAddress,
      detailsJson: JSON.stringify({
        incidentCode: incident.incidentCode,
        responder: responderProfile.fullName,
        responderId: responderUserId,
      }),
    });

    // Notify responder
    await Notification.create({
      user: responderUser._id,
      incident: incident._id,
      title: `DISPATCH ALERT: Incident ${incident.incidentCode}`,
      message: `You have been assigned to ${incident.title} at ${incident.campusLocation}.`,
      channel: 'BOTH',
    });

    res.status(201).json({ success: true, assignment, incident });
  } catch (err: any) {
    console.error('[RescueGrid Assignment Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Dispatch failed' });
  }
});

// 2. Get My Assigned Incidents (Responder)
router.get('/my', requireAuth, requireRole('responder', 'admin'), async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const assignments = await IncidentAssignment.find({ responder: req.user!._id })
      .populate('incident')
      .sort({ assignedAt: -1 });

    res.json({ success: true, count: assignments.length, assignments });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error fetching assignments' });
  }
});

export default router;
