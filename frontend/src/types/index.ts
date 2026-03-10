export interface Staff {
  _id: string;
  name: string;
  email: string;
  phone: string;
  specialization: 'CHIRO' | 'PHYSIO' | 'MASSAGE' | 'STRETCHING' | 'CUPPING';
  experience: number; // years
  bio?: string;
  image?: string;
  availability: Availability[];
  createdAt: string;
}

export interface Availability {
  date: string; // ISO date
  slots: TimeSlot[];
}

export interface TimeSlot {
  startTime: string; // e.g., "09:00"
  endTime: string; // e.g., "10:00"
  isBooked: boolean;
}

export interface Appointment {
  _id: string;
  patientId: string;
  patientName: string;
  staffId: string;
  staffName: string;
  treatment: 'CHIRO' | 'PHYSIO' | 'MASSAGE' | 'STRETCHING' | 'CUPPING';
  date: string;
  startTime: string;
  endTime: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  symptoms?: string;
  notes?: string;
  createdAt: string;
}

export interface AppointmentRequest {
  patientId: string;
  patientName: string;
  staffId: string;
  treatment: string;
  date: string;
  startTime: string;
  endTime: string;
  symptoms?: string;
  notes?: string;
}