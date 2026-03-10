import { authService } from "./authService";

const API_BASE_URL = 'http://localhost:8000/api/v1';

export interface Therapist {
  therapist_id: string;
  name: string;
  bio?: string;
  gender?: string;
  specialities?: string[];
  is_available: boolean;
  createdAt?: string;
}

export interface Treatment {
  treatment_id: string;
  name: string;
  category: string;
  subCategory?: string;
  target?: string;
  price: number;
  duration: number;
  description?: string;
  isActive: boolean;
}

export interface Appointment {
  appointment_id: string;
  patient_id: string;
  treatment_id: string;
  therapist_id?: string;
  date: string;
  time: string;
  status: string;
  patient?: {
    name: string;
    contact_no?: string;
    email?: string;
  };
  treatment?: {
    name: string;
    category: string;
    duration: number;
    price: number;
  };
}

export interface User {
  userId: string;
  name: string;
  email: string;
  role: string;
  lastLogin?: string;
  contact_no?: string;
  age?: number;
  gender?: string;
}

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${authService.getToken() || ''}`,
});

export const staffService = {

  // ── Dashboard ──────────────────────────────────────────────────────────────
  getDashboard: async (): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/staff/dashboard`, {
      headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch dashboard');
    return response.json();
  },

  // ── Appointments ───────────────────────────────────────────────────────────
  // Backend only has /pending route — for confirmed/all we use the appointments collection
  getAppointments: async (filter: string = 'pending'): Promise<Appointment[]> => {
    let url: string;
    if (filter === 'pending') {
      // dedicated endpoint returns enriched pending appointments
      url = `${API_BASE_URL}/staff/appointments/pending`;
    } else if (filter === 'all') {
      // no status filter — returns everything
      url = `${API_BASE_URL}/staff/appointments/all`;
    } else {
      // confirmed / cancelled / completed — filter server-side
      // 'cancelled' covers both rejected and manually cancelled appointments
      url = `${API_BASE_URL}/staff/appointments/all?status=${filter}`;
    }
    const response = await fetch(url, { headers: authHeaders() });
    if (!response.ok) return [];
    return response.json();
  },

  approveAppointment: async (appointmentId: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/staff/appointments/${appointmentId}/approve`, {
      method: 'PUT',
      headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to approve appointment');
    return response.json();
  },

  rejectAppointment: async (appointmentId: string, reason?: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/staff/appointments/${appointmentId}/reject`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!response.ok) throw new Error('Failed to reject appointment');
    return response.json();
  },

  sendSMS: async (appointmentId: string, message: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/staff/appointments/${appointmentId}/sms`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ message }),
    });
    if (!response.ok) throw new Error('SMS service not available');
    return response.json();
  },

  // ── Therapists ─────────────────────────────────────────────────────────────
  getTherapists: async (includeInactive: boolean = false): Promise<Therapist[]> => {
    const url = includeInactive
      ? `${API_BASE_URL}/staff/therapists?include_inactive=true`
      : `${API_BASE_URL}/staff/therapists`;
    const response = await fetch(url, { headers: authHeaders() });
    if (!response.ok) return [];
    return response.json();
  },

  createTherapist: async (data: Partial<Therapist>): Promise<Therapist> => {
    const response = await fetch(`${API_BASE_URL}/staff/therapists`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create therapist');
    return response.json();
  },

  updateTherapist: async (therapistId: string, data: Partial<Therapist>): Promise<Therapist> => {
    const response = await fetch(`${API_BASE_URL}/staff/therapists/${therapistId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update therapist');
    return response.json();
  },

  deleteTherapist: async (therapistId: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/staff/therapists/${therapistId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete therapist');
    return response.json();
  },

  // ── Therapist Availability ─────────────────────────────────────────────────
  getTherapistAvailability: async (therapistId: string): Promise<any> => {
    const response = await fetch(
      `${API_BASE_URL}/staff/therapists/${therapistId}/availability`,
      { headers: authHeaders() }
    );
    if (!response.ok) throw new Error('Failed to fetch availability');
    return response.json();
  },

  setTherapistAvailability: async (therapistId: string, slots: any[]): Promise<any> => {
    const response = await fetch(
      `${API_BASE_URL}/staff/therapists/${therapistId}/availability`,
      {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(slots),
      }
    );
    if (!response.ok) throw new Error('Failed to set availability');
    return response.json();
  },

  // ── Treatments ─────────────────────────────────────────────────────────────
  getTreatments: async (includeInactive: boolean = false): Promise<Treatment[]> => {
    const url = includeInactive
      ? `${API_BASE_URL}/staff/treatments?include_inactive=true`
      : `${API_BASE_URL}/staff/treatments`;
    const response = await fetch(url, { headers: authHeaders() });
    if (!response.ok) return [];
    return response.json();
  },

  createTreatment: async (data: Partial<Treatment>): Promise<Treatment> => {
    const response = await fetch(`${API_BASE_URL}/staff/treatments`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create treatment');
    return response.json();
  },

  updateTreatment: async (treatmentId: string, data: Partial<Treatment>): Promise<Treatment> => {
    const response = await fetch(`${API_BASE_URL}/staff/treatments/${treatmentId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update treatment');
    return response.json();
  },

  deleteTreatment: async (treatmentId: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/staff/treatments/${treatmentId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete treatment');
    return response.json();
  },

  activateTreatment: async (treatmentId: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/staff/treatments/${treatmentId}/activate`, {
      method: 'POST',
      headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to activate treatment');
    return response.json();
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  getUsers: async (role: string | null = null): Promise<User[]> => {
    const url = role
      ? `${API_BASE_URL}/staff/users?role=${role}`
      : `${API_BASE_URL}/staff/users`;
    const response = await fetch(url, { headers: authHeaders() });
    if (!response.ok) return [];
    return response.json();
  },

  updateUser: async (userId: string, data: any): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/staff/users/${userId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },

  deleteUser: async (userId: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/staff/users/${userId}`, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete user');
    return response.json();
  },
};