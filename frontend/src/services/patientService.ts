import { authService } from './authService';

const API_BASE = 'http://localhost:8000/api/v1';
const AUTH_BASE = 'http://localhost:8000/api/auth';

const authHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${authService.getToken() || ''}`,
});

export interface PatientStats {
  total_appointments: number;
  upcoming_appointments: number;
  completed_appointments: number;
  total_symptoms: number;
  total_recommendations: number;
  most_common_treatment: string | null;
}

export interface AppointmentRequest {
  treatment_id: string;
  preferred_date: string;      // ISO date string
  preferred_time: string;      // e.g. "10:00"
  therapist_gender?: string;   // 'Male' | 'Female' | 'No Preference'
  notes?: string;
}

export interface PatientAppointment {
  appointment_id: string;
  patient_id: string;
  treatment_id: string;
  therapist_id?: string;
  date: string;
  time: string;
  status: string;
  notes?: string;
  therapist_gender_pref?: string;
  rejection_reason?: string;
  treatment?: {
    name: string;
    category: string;
    duration: number;
    price: number;
  };
  therapist?: {
    name: string;
    is_available: boolean;
  };
}

export interface PatientProfile {
  patient_id: string;
  name: string;
  email: string;
  contact_no: string;
  age: number;
  gender: string;
}

export interface ProfileUpdateData {
  name: string;
  contact_no: string;
  age: number;
  gender: string;
}

export const patientService = {

  // ── Stats ──────────────────────────────────────────────────────────────────
  getStats: async (patientId: string): Promise<PatientStats> => {
    const res = await fetch(`${API_BASE}/patients/${patientId}/stats`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch stats');
    const data = await res.json();
    return data.statistics;
  },

  // ── Appointments ───────────────────────────────────────────────────────────
  getUpcomingAppointments: async (patientId: string): Promise<PatientAppointment[]> => {
    const res = await fetch(`${API_BASE}/patients/${patientId}/appointments/upcoming`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  getPastAppointments: async (patientId: string): Promise<PatientAppointment[]> => {
    const res = await fetch(`${API_BASE}/patients/${patientId}/appointments/past`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  getAllAppointments: async (patientId: string): Promise<PatientAppointment[]> => {
    const res = await fetch(`${API_BASE}/patients/${patientId}/appointments`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  requestAppointment: async (patientId: string, data: AppointmentRequest): Promise<any> => {
    const res = await fetch(`${API_BASE}/patients/${patientId}/appointments/request`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to request appointment' }));
      throw new Error(err.detail || 'Failed to request appointment');
    }
    return res.json();
  },

  cancelAppointment: async (appointmentId: string): Promise<any> => {
    const res = await fetch(`${API_BASE}/patients/appointments/${appointmentId}/cancel`, {
      method: 'PUT',
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to cancel appointment');
    return res.json();
  },

  // ── Treatments (public catalogue) ─────────────────────────────────────────
  getTreatments: async (): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/treatments/`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  // ── Profile ────────────────────────────────────────────────────────────────
  getProfile: async (patientId: string): Promise<PatientProfile> => {
    const res = await fetch(`${API_BASE}/patients/${patientId}`, {
      headers: authHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch profile');
    return res.json();
  },

  updateProfile: async (patientId: string, data: ProfileUpdateData): Promise<PatientProfile> => {
    const res = await fetch(`${API_BASE}/patients/${patientId}`, {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to update profile' }));
      throw new Error(err.detail || 'Failed to update profile');
    }
    return res.json();
  },

  // ── Treatment history (symptoms + recommendations) ─────────────────────────
  getSymptomHistory: async (patientId: string): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/patients/${patientId}/symptoms`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },

  getRecommendations: async (patientId: string): Promise<any[]> => {
    const res = await fetch(`${API_BASE}/patients/${patientId}/recommendations`, {
      headers: authHeaders(),
    });
    if (!res.ok) return [];
    return res.json();
  },
};