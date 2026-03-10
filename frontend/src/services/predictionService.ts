const API_BASE_URL = 'http://localhost:8000/api/v1/predict';

export interface PredictRequest {
  symptom_text: string;
  age: number;
  gender: number;       // 1=female, 2=male, 3=non-binary
  had_injury: number;   // 0 or 1
  duration?: string;
  patient_id?: string;
}

export interface AlternativeTreatment {
  treatment: string;
  treatment_label: string;
  confidence: number;
}

export interface SimilarCase {
  symptom: string;
  treatment: string;
  treatment_label: string;
  similarity: number;
  age?: number;
  gender?: number;
}

export interface PredictionResult {
  severity?: {
    score: number;
    level: string;
    confidence: number;
  };
  treatment: {
    recommendation: string;
    recommendation_label: string;
    description: string;
    confidence: number;
    alternatives: AlternativeTreatment[];
  };
  evidence: {
    similar_cases: SimilarCase[];
    match_quality: string;
    total_matches: number;
  };
}

export const predictionService = {

  completeAnalysis: async (data: PredictRequest): Promise<{ success: boolean; data: PredictionResult }> => {
    const response = await fetch(`${API_BASE_URL}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Prediction failed' }));
      throw new Error(error.detail || 'Prediction failed');
    }
    return response.json();
  },

  predictTreatment: async (data: PredictRequest): Promise<{ success: boolean; data: any }> => {
    const response = await fetch(`${API_BASE_URL}/treatment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Prediction failed' }));
      throw new Error(error.detail || 'Prediction failed');
    }
    return response.json();
  },

  predictSeverity: async (symptom_text: string): Promise<{ success: boolean; data: any }> => {
    const response = await fetch(`${API_BASE_URL}/severity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ symptom_text }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Prediction failed' }));
      throw new Error(error.detail || 'Prediction failed');
    }
    return response.json();
  },
};