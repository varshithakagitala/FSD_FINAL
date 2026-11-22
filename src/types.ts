export type UserRole = 'student' | 'responder' | 'admin' | 'STUDENT' | 'RESPONDER' | 'ADMIN';

export interface User {
  _id?: string;
  userId?: string | number;
  name?: string;
  fullName?: string;
  email: string;
  role: UserRole;
  studentId?: string;
  department?: string;
  phoneNumber?: string;
  isEmailVerified?: boolean;
  isVerified?: boolean;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Incident {
  _id?: string;
  incidentId?: string | number;
  incidentCode: string;
  reporter?: string;
  reporterId?: string | number;
  reporterName: string;
  reporterEmail: string;
  title: string;
  category: 'Medical' | 'Fire' | 'Security' | 'Accident' | 'Electrical' | 'Infrastructure' | 'Other';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  calculatedPriority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Reported' | 'Assigned' | 'Accepted' | 'En Route' | 'On Scene' | 'Resolved' | 'Unable to Respond' | 'Cancelled';
  campusLocation: string;
  latitude?: number;
  longitude?: number;
  description: string;
  contactNumber?: string;
  photoUrl?: string;
  createdAt: string;
  resolvedAt?: string;
  assignedResponder?: any;
  assignedResponderId?: string | number;
  assignedResponderName?: string;
  assignedResponderBadge?: string;
}

export interface ResponderProfile {
  _id?: string;
  profileId?: string | number;
  user?: any;
  userId?: string | number;
  fullName: string;
  email?: string;
  phoneNumber?: string;
  badgeNumber: string;
  specialization: 'Medical' | 'Fire' | 'Security' | 'Electrical' | 'General';
  currentStatus: 'Available' | 'Dispatched' | 'Busy' | 'Off Duty';
  currentLatitude?: number;
  currentLongitude?: number;
  campusBaseZone: string;
  activeIncidentsCount: number;
  matchScore?: number;
  distanceKm?: number;
}

export interface IncidentUpdate {
  _id?: string;
  updateId?: string | number;
  incident?: string | any;
  incidentId?: string | number;
  updatedByUser?: string | any;
  updatedByUserId?: string | number;
  updaterName: string;
  updaterRole: string;
  statusBefore: string;
  statusAfter: string;
  noteText: string;
  photoUrl?: string;
  createdAt: string;
}

export interface AuditLog {
  _id?: string;
  logId?: string | number;
  user?: any;
  userId?: string | number;
  userName?: string;
  actionType: string;
  entityName: string;
  entityId?: string | number;
  ipAddress?: string;
  detailsJson?: string;
  createdAt: string;
}

export interface SystemStatus {
  database: {
    type: string;
    connected: boolean;
    connectionMode: 'atlas' | 'memory' | 'disconnected';
    clusterHost: string;
    databaseName: string;
    atlasConfigured?: boolean;
    ipWhitelistNeeded?: boolean;
    outboundIp?: string;
    error?: string | null;
  };
  smtp: {
    host: string;
    port: string;
    isConfigured: boolean;
    diagnosticMode: boolean;
  };
}
