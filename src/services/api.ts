const API_BASE = '/api';

function getStoredToken(): string | null {
  return localStorage.getItem('rescuegrid_token');
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem('rescuegrid_token', token);
  } else {
    localStorage.removeItem('rescuegrid_token');
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json();
  if (!res.ok || data.success === false) {
    const errorMsg = data.error || data.message || `HTTP error ${res.status}`;
    const err: any = new Error(errorMsg);
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}

// Auth API
export const api = {
  // Auth
  signup: (userData: any) => request<any>('/auth/signup', { method: 'POST', body: JSON.stringify(userData) }),
  verifySignupOtp: (email: string, otpCode: string) =>
    request<any>('/auth/verify-signup-otp', { method: 'POST', body: JSON.stringify({ email, otpCode }) }),
  resendOtp: (email: string, purpose: 'signup' | 'login') =>
    request<any>('/auth/resend-otp', { method: 'POST', body: JSON.stringify({ email, purpose }) }),
  login: (credentials: { email: string; password: string }) =>
    request<any>('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
  verifyLoginOtp: (email: string, otpCode: string) =>
    request<any>('/auth/verify-login-otp', { method: 'POST', body: JSON.stringify({ email, otpCode }) }),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),
  getMe: () => request<any>('/auth/me'),

  // Incidents
  createIncident: (incidentData: any) =>
    request<any>('/incidents', { method: 'POST', body: JSON.stringify(incidentData) }),
  getIncidents: () => request<any>('/incidents'),
  getIncident: (id: string | number) => request<any>(`/incidents/${id}`),
  updateStatus: (id: string | number, status: string, noteText?: string) =>
    request<any>(`/incidents/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, noteText }) }),
  overridePriority: (id: string | number, priority: string) =>
    request<any>(`/incidents/${id}/priority`, { method: 'PATCH', body: JSON.stringify({ priority }) }),

  // Assignments
  assignResponder: (incidentId: string | number, responderUserId: string | number, notes?: string) =>
    request<any>('/assignments', { method: 'POST', body: JSON.stringify({ incidentId, responderUserId, notes }) }),
  getMyAssignments: () => request<any>('/assignments/my'),

  // Admin
  getAdminDashboard: () => request<any>('/admin/dashboard'),
  getUsers: () => request<any>('/admin/users'),
  updateUser: (id: string, update: { isActive?: boolean; role?: string }) =>
    request<any>(`/admin/users/${id}`, { method: 'PATCH', body: JSON.stringify(update) }),
  getAuditLogs: (limit = 50) => request<any>(`/admin/audit-logs?limit=${limit}`),
  getResponders: (incidentId?: string | number) =>
    request<any>(`/admin/responders${incidentId ? `?incidentId=${incidentId}` : ''}`),

  // System
  getStatus: () => request<any>('/status'),
  retryAtlas: () => request<any>('/db/retry-atlas', { method: 'POST' }),
};
