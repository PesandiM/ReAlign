import api from './api';
//import { SPECIALIZATION_CATEGORY_MAP, getSpecializationsForTreatment } from '../constants/treatmentMap';

export interface Therapist {
  _id: string;
  name: string;
  specialities: 'CHIRO' | 'PHYSIO' | 'MASSAGE';
  experience: number;
  bio?: string;
  image?: string;
  isActive: boolean;
  availability: Availability[];
}

export interface Availability {
  date: string;
  slots: TimeSlot[];
}

export interface TimeSlot {
  startTime: string;
  endTime: string;
  isBooked: boolean;
  bookedBy?: string;
}

export const therapistApi = {
  // Get all therapists
  getAll: async (): Promise<{ data: Therapist[] }> => {
    return api.get('/therapists');
  },
  
  // Get active therapists only
  getActive: async (): Promise<{ data: Therapist[] }> => {
    return api.get('/therapists', { params: { isActive: true } });
  },
  
  // Get available therapists for a specific treatment and date
  /*getAvailableForTreatment: async (treatmentCategory: string, date: string): Promise<{ data: Therapist[] }> => {
    // Get which specializations can do this treatment
    const applicableSpecializations = getSpecializationsForTreatment(treatmentCategory);
    
    if (applicableSpecializations.length === 0) {
      return { data: [] };
    }
    
    // Fetch therapists with those specializations who are available on the given date
    return api.get('/therapists/available', {
      params: { 
        specializations: applicableSpecializations.join(','),
        date 
      }
    });
  },*/
  
  // Get a single therapist by ID
  getById: async (therapistId: string): Promise<{ data: Therapist }> => {
    return api.get(`/therapists/${therapistId}`);
  },
  
  // Get the specialization map (if needed from backend)
  /*getSpecializationMap: async (): Promise<{ data: typeof SPECIALIZATION_CATEGORY_MAP }> => {
    return api.get('/therapists/specialization-map');
  },*/
  
  // Get treatments a specific therapist can perform
  getTherapistTreatments: async (therapistId: string): Promise<{ data: any[] }> => {
    return api.get(`/therapists/${therapistId}/available-treatments`);
  },
  
  // Get therapist's availability for a date range
  getAvailability: async (therapistId: string, startDate: string, endDate: string): Promise<{ data: Availability[] }> => {
    return api.get(`/therapists/${therapistId}/availability`, {
      params: { startDate, endDate }
    });
  }
};