import { Router, Response } from 'express';
import { Incident, IIncident, IncidentStatus, IncidentPriority } from '../models/Incident';
import { IncidentUpdate } from '../models/IncidentUpdate';
import { ResponderProfile } from '../models/ResponderProfile';
import { Notification } from '../models/Notification';
import { AuditLog } from '../models/AuditLog';
import { User } from '../models/User';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/authMiddleware';
import { calculateSuggestedPriority } from '../services/severityEngine';
import { emailService } from '../services/emailService';

const router = Router();

// 1. Submit Emergency Report
router.post('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, category, campusLocation, latitude, longitude, contactNumber, photoUrl } =
      req.body;

    if (!title || !description || !category || !campusLocation) {
      res.status(400).json({
        success: false,
        error: 'Title, description, category, and campus location are required fields.',
      });
      return;
    }

    const calculatedPriority = calculateSuggestedPriority(category, description, title);
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const incidentCode = `INC-${dateStr}-${randomSuffix}`;

    const incident = await Incident.create({
      incidentCode,
      reporter: req.user!._id,
      reporterName: req.user!.name,
      reporterEmail: req.user!.email,
      title: title.trim(),
      description: description.trim(),
      category,
      priority: calculatedPriority,
      calculatedPriority,
      status: 'Reported',
      campusLocation: campusLocation.trim(),
      latitude: latitude != null ? Number(latitude) : undefined,
      longitude: longitude != null ? Number(longitude) : undefined,
      contactNumber: contactNumber?.trim() || req.user!.phoneNumber,
      photoUrl: photoUrl?.trim(),
    });

    // Initial timeline record
    await IncidentUpdate.create({
      incident: incident._id,
      updatedByUser: req.user!._id,
      updaterName: req.user!.name,
      updaterRole: req.user!.role,
      statusBefore: 'None',
      statusAfter: 'Reported',
      noteText: `Emergency reported. Severity engine assessed priority as ${calculatedPriority}.`,
      photoUrl: incident.photoUrl,
    });

    // Audit Log
    await AuditLog.create({
      user: req.user!._id,
      userName: req.user!.name,
      actionType: 'INCIDENT_REPORTED',
      entityName: 'incidents',
      entityId: incident._id.toString(),
      ipAddress: req.ip || req.socket.remoteAddress,
      detailsJson: JSON.stringify({ incidentCode, priority: calculatedPriority, category }),
    });

    // Notify Administrators
    const admins = await User.find({ role: 'admin', isActive: true });
    for (const admin of admins) {
      await Notification.create({
        user: admin._id,
        incident: incident._id,
        title: `New ${calculatedPriority} Emergency Reported: ${incidentCode}`,
        message: `${incident.title} at ${incident.campusLocation}. Category: ${category}.`,
        channel: 'BOTH',
      });
    }

    res.status(201).json({ success: true, incident });
  } catch (err: any) {
    console.error('[RescueGrid Incident Create Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Failed to submit report' });
  }
});

// 2. Get Incidents (Role-authorized filtering)
router.get('/', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let query: any = {};

    if (user.role === 'student') {
      // Students only access their own reports
      query.reporter = user._id;
    } else if (user.role === 'responder') {
      // Responders see incidents assigned to them or unassigned/open
      query = {
        $or: [
          { assignedResponder: user._id },
          { status: { $in: ['Reported', 'Assigned', 'Accepted', 'En Route', 'On Scene'] } },
        ],
      };
    }
    // Admins see all incidents

    const incidents = await Incident.find(query).sort({ createdAt: -1 });
    res.json({ success: true, count: incidents.length, incidents });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Failed to fetch incidents' });
  }
});

// 3. Get Single Incident with Timeline Updates
router.get('/:id', requireAuth, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    let incident: IIncident | null = null;

    if (id.startsWith('INC-')) {
      incident = await Incident.findOne({ incidentCode: id });
    } else {
      incident = await Incident.findById(id);
    }

    if (!incident) {
      res.status(404).json({ success: false, error: 'Incident record not found.' });
      return;
    }

    // Role-based authorization
    if (req.user!.role === 'student' && incident.reporter.toString() !== req.user!._id.toString()) {
      res.status(403).json({ success: false, error: 'Access denied: You are not the author of this report.' });
      return;
    }

    const updates = await IncidentUpdate.find({ incident: incident._id }).sort({ createdAt: 1 });
    res.json({ success: true, incident, updates });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Error retrieving incident' });
  }
});

// 4. Update Incident Status (Responder / Admin)
router.patch(
  '/:id/status',
  requireAuth,
  requireRole('responder', 'admin'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status, noteText } = req.body;

      if (!status) {
        res.status(400).json({ success: false, error: 'New status is required.' });
        return;
      }

      const incident = await Incident.findById(id);
      if (!incident) {
        res.status(404).json({ success: false, error: 'Incident not found.' });
        return;
      }

      const statusBefore = incident.status;
      incident.status = status as IncidentStatus;

      if (status === 'Resolved') {
        incident.resolvedAt = new Date();
        // Decrement responder active count
        if (incident.assignedResponder) {
          await ResponderProfile.findOneAndUpdate(
            { user: incident.assignedResponder },
            { $inc: { activeIncidentsCount: -1 }, currentStatus: 'Available' }
          );
        }
      }

      await incident.save();

      // Record timeline entry
      const updateDoc = await IncidentUpdate.create({
        incident: incident._id,
        updatedByUser: req.user!._id,
        updaterName: req.user!.name,
        updaterRole: req.user!.role,
        statusBefore,
        statusAfter: status,
        noteText: noteText?.trim() || `Status updated from ${statusBefore} to ${status}.`,
      });

      // Audit Log
      await AuditLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        actionType: 'INCIDENT_STATUS_CHANGE',
        entityName: 'incidents',
        entityId: incident._id.toString(),
        ipAddress: req.ip || req.socket.remoteAddress,
        detailsJson: JSON.stringify({ from: statusBefore, to: status }),
      });

      // Notify reporting student via in-app notification
      await Notification.create({
        user: incident.reporter,
        incident: incident._id,
        title: `Status Update: ${incident.incidentCode} is now ${status}`,
        message: noteText || `Your report has been marked as ${status}.`,
        channel: 'BOTH',
      });

      // Send real SMTP notification to student
      if (incident.reporterEmail) {
        await emailService.sendIncidentNotification(
          incident.reporterEmail,
          incident.reporterName,
          incident.incidentCode,
          status,
          noteText
        );
      }

      res.json({ success: true, incident, update: updateDoc });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Status update failed' });
    }
  }
);

// 5. Override Priority (Admin Only)
router.patch(
  '/:id/priority',
  requireAuth,
  requireRole('admin'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { priority } = req.body;

      if (!priority || !['Low', 'Medium', 'High', 'Critical'].includes(priority)) {
        res.status(400).json({ success: false, error: 'Valid priority required (Low, Medium, High, Critical).' });
        return;
      }

      const incident = await Incident.findById(id);
      if (!incident) {
        res.status(404).json({ success: false, error: 'Incident not found.' });
        return;
      }

      const oldPriority = incident.priority;
      incident.priority = priority as IncidentPriority;
      await incident.save();

      await IncidentUpdate.create({
        incident: incident._id,
        updatedByUser: req.user!._id,
        updaterName: req.user!.name,
        updaterRole: 'admin',
        statusBefore: incident.status,
        statusAfter: incident.status,
        noteText: `Priority overridden from ${oldPriority} to ${priority} by Command Center.`,
      });

      await AuditLog.create({
        user: req.user!._id,
        userName: req.user!.name,
        actionType: 'ADMIN_PRIORITY_OVERRIDE',
        entityName: 'incidents',
        entityId: incident._id.toString(),
        ipAddress: req.ip || req.socket.remoteAddress,
        detailsJson: JSON.stringify({ from: oldPriority, to: priority }),
      });

      res.json({ success: true, incident });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message || 'Priority override failed' });
    }
  }
);

export default router;
