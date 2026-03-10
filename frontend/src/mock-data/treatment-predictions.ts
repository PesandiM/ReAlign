export interface Prediction {
  treatment: string;
  confidence: number;
  description: string;
  duration: string;
}

export const mockPredictions = {
  "back pain": {
    primary: {
      treatment: "CHIRO",
      confidence: 87,
      description: "Chiropractic adjustment for spinal alignment",
      duration: "30-45 min"
    },
    alternatives: [
      {
        treatment: "PHYSIO",
        confidence: 62,
        description: "Therapeutic exercises and mobilization",
        duration: "45-60 min"
      },
      {
        treatment: "MASSAGE",
        confidence: 45,
        description: "Deep tissue massage for muscle tension",
        duration: "60 min"
      }
    ]
  },
  "neck pain": {
    primary: {
      treatment: "CHIRO",
      confidence: 82,
      description: "Cervical spine adjustment",
      duration: "30 min"
    },
    alternatives: [
      {
        treatment: "MASSAGE",
        confidence: 71,
        description: "Neck and shoulder massage",
        duration: "45 min"
      },
      {
        treatment: "PHYSIO",
        confidence: 53,
        description: "Neck mobilization exercises",
        duration: "40 min"
      }
    ]
  },
  "shoulder pain": {
    primary: {
      treatment: "PHYSIO",
      confidence: 79,
      description: "Shoulder rehabilitation exercises",
      duration: "45 min"
    },
    alternatives: [
      {
        treatment: "MASSAGE",
        confidence: 68,
        description: "Rotator cuff massage",
        duration: "45 min"
      },
      {
        treatment: "CHIRO",
        confidence: 41,
        description: "Upper back and shoulder adjustment",
        duration: "30 min"
      }
    ]
  },
  "muscle tension": {
    primary: {
      treatment: "MASSAGE",
      confidence: 91,
      description: "Full body relaxation massage",
      duration: "60-90 min"
    },
    alternatives: [
      {
        treatment: "STRETCHING",
        confidence: 64,
        description: "Guided stretching session",
        duration: "30 min"
      },
      {
        treatment: "CHIRO",
        confidence: 38,
        description: "Spinal alignment for posture",
        duration: "30 min"
      }
    ]
  }
};

export const getMockPrediction = (symptoms: string) => {
  // Simple keyword matching for demo
  const lowerSymptoms = symptoms.toLowerCase();
  if (lowerSymptoms.includes("back")) return mockPredictions["back pain"];
  if (lowerSymptoms.includes("neck")) return mockPredictions["neck pain"];
  if (lowerSymptoms.includes("shoulder")) return mockPredictions["shoulder pain"];
  if (lowerSymptoms.includes("muscle") || lowerSymptoms.includes("tension")) 
    return mockPredictions["muscle tension"];
  
  // Default
  return mockPredictions["back pain"];
};