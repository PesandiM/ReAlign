/*export const SPECIALIZATION_CATEGORY_MAP = {
  'CHIRO': ['CHIRO'],
  'PHYSIO': ['WELLNESS', 'STRETCHING', 'PHYSIO'],
  'MASSAGE': ['MASSAGE', 'GUA_SHA', 'CUPPING']
} as const;

// Define types based on the map
export type Specialization = keyof typeof SPECIALIZATION_CATEGORY_MAP;
export type TreatmentCategory = typeof SPECIALIZATION_CATEGORY_MAP[Specialization][number];

// Helper function to check if a therapist can perform a treatment
export const canTherapistPerformTreatment = (
  therapistSpecialization: Specialization, 
  treatmentCategory: string
): boolean => {
  const allowedCategories = SPECIALIZATION_CATEGORY_MAP[therapistSpecialization];
  return allowedCategories.includes(treatmentCategory as TreatmentCategory);
};

// Get all treatments for a therapist specialization
export const getTreatmentCategoriesForSpecialization = (
  specialization: Specialization
): string[] => {
  return [...SPECIALIZATION_CATEGORY_MAP[specialization]];
};

// Get all specializations that can perform a given treatment category
export const getSpecializationsForTreatment = (
  treatmentCategory: string
): Specialization[] => {
  return (Object.entries(SPECIALIZATION_CATEGORY_MAP) as [Specialization, TreatmentCategory[]][])
    .filter(([_, categories]) => categories.includes(treatmentCategory as TreatmentCategory))
    .map(([spec]) => spec);
}; */

export {}