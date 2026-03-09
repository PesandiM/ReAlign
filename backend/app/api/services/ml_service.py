import joblib
import numpy as np
import sys
from scipy.sparse import hstack, csr_matrix
from typing import Dict, Any, Optional
import os
import re
import logging

logger = logging.getLogger(__name__)


class SimilarityEngine:
    def __init__(self, embeddings, texts, metadata=None):
        self.embeddings = embeddings
        self.texts = texts.reset_index(drop=True) if hasattr(texts, 'reset_index') else texts
        self.metadata = metadata

    def find_similar(self, query_text, top_k=5, similarity_threshold=0.3):
        from sklearn.metrics.pairwise import cosine_similarity as cos_sim
        if not hasattr(self, '_tfidf') or not hasattr(self, '_svd'):
            return [], 'LOW'
        query_tfidf = self._tfidf.transform([query_text])
        query_embedding = self._svd.transform(query_tfidf)
        similarities = cos_sim(query_embedding, self.embeddings)[0]
        valid_indices = np.where(similarities >= similarity_threshold)[0]
        if len(valid_indices) == 0:
            valid_indices = similarities.argsort()[-top_k:][::-1]
            confidence = 'LOW'
        else:
            sorted_indices = valid_indices[similarities[valid_indices].argsort()[::-1]]
            valid_indices = sorted_indices[:top_k]
            confidence = 'HIGH' if len(valid_indices) > 5 else 'MEDIUM'
        results = []
        for idx in valid_indices:
            result = {
                'text': str(self.texts.iloc[idx]) if hasattr(self.texts, 'iloc') else str(self.texts[idx]),
                'similarity': float(similarities[idx]),
                'index': int(idx)
            }
            if self.metadata is not None and idx < len(self.metadata):
                row = self.metadata.iloc[idx] if hasattr(self.metadata, 'iloc') else self.metadata[idx]
                result['metadata'] = {
                    'treatment_3class': row.get('treatment_3class', 'UNKNOWN') if hasattr(row, 'get') else 'UNKNOWN',
                    'age': row.get('age', None) if hasattr(row, 'get') else None,
                    'gender': row.get('gender', None) if hasattr(row, 'get') else None,
                }
            results.append(result)
        return results, confidence

    def get_recommendation(self, query_text, top_k=10):
        from collections import Counter
        results, confidence = self.find_similar(query_text, top_k=top_k)
        if not results:
            return {'recommendation': 'UNKNOWN', 'confidence': 0, 'similar_cases': [], 'total_matches': 0, 'match_quality': confidence}
        treatments = [r['metadata']['treatment_3class'] for r in results if r.get('metadata')]
        if not treatments:
            return {'recommendation': 'UNKNOWN', 'confidence': 0, 'similar_cases': results[:3], 'total_matches': len(results), 'match_quality': confidence}
        counts = Counter(treatments)
        primary = counts.most_common(1)[0][0]
        return {
            'recommendation': primary,
            'confidence': counts.most_common(1)[0][1] / len(treatments),
            'similar_cases': results[:3],
            'total_matches': len(results),
            'match_quality': confidence
        }


class EnsembleRecommender:
    def __init__(self, rf_model, similarity_engine, tfidf_vectorizer, scaler, label_encoder):
        self.rf_model = rf_model
        self.similarity_engine = similarity_engine
        self.tfidf = tfidf_vectorizer
        self.scaler = scaler
        self.le = label_encoder

    def predict(self, symptom_text, age=30, gender=2, had_injury=0, duration_days=30):
        text_tfidf = self.tfidf.transform([symptom_text])
        demo = np.array([[age, gender, had_injury, duration_days]])
        demo_scaled = self.scaler.transform(demo)
        X_combined = hstack([text_tfidf, csr_matrix(demo_scaled)])
        rf_proba = self.rf_model.predict_proba(X_combined)[0]
        rf_pred = self.le.inverse_transform([np.argmax(rf_proba)])[0]
        if self.similarity_engine is not None:
            sim_rec = self.similarity_engine.get_recommendation(symptom_text)
        else:
            sim_rec = {'recommendation': 'UNKNOWN', 'confidence': 0, 'similar_cases': []}
        sim_treatment = sim_rec.get('recommendation', 'UNKNOWN')
        rf_confidence = float(np.max(rf_proba))
        sim_confidence = float(sim_rec.get('confidence', 0))
        if rf_confidence > 0.5 or sim_confidence < 0.3:
            final_pred = rf_pred
            confidence = rf_confidence
        elif sim_confidence > 0.7:
            final_pred = sim_treatment
            confidence = sim_confidence
        else:
            combined_proba = rf_proba.copy()
            if sim_treatment in self.le.classes_:
                sim_index = self.le.transform([sim_treatment])[0]
                combined_proba[sim_index] += sim_confidence * 0.5
            final_pred = self.le.inverse_transform([np.argmax(combined_proba)])[0]
            confidence = float(np.max(combined_proba))
        return {
            'recommendation': final_pred,
            'confidence': confidence,
            'rf_prediction': rf_pred,
            'rf_confidence': rf_confidence,
            'similarity_recommendation': sim_treatment,
            'similarity_confidence': sim_confidence,
            'similar_cases': sim_rec.get('similar_cases', [])
        }


TREATMENT_LABELS = {
    'MANUAL_THERAPY': 'Chiropractic / Physiotherapy',
    'SOFT_TISSUE':    'Massage / Soft Tissue Therapy',
    'MOVEMENT_OTHER': 'Movement & Wellness Therapy',
}

TREATMENT_DESCRIPTIONS = {
    'MANUAL_THERAPY': 'Hands-on spinal or joint manipulation and targeted physiotherapy exercises.',
    'SOFT_TISSUE':    'Therapeutic massage, Gua Sha, or dry cupping for muscle tension relief.',
    'MOVEMENT_OTHER': 'Yoga therapy, stretching, or holistic wellness sessions.',
}


def parse_duration(duration):
    if not duration:
        return 30
    duration = duration.lower()
    numbers = re.findall(r'\d+', duration)
    if not numbers:
        return 30
    num = int(numbers[0])
    if 'year' in duration:
        return num * 365
    elif 'month' in duration:
        return num * 30
    elif 'week' in duration:
        return num * 7
    else:
        return num


# Patch sys.modules so pickle resolves __mp_main__.SimilarityEngine correctly
class _FakeMainModule:
    pass
_FakeMainModule.SimilarityEngine = SimilarityEngine
_FakeMainModule.EnsembleRecommender = EnsembleRecommender
sys.modules['__mp_main__'] = _FakeMainModule()


class MLService:

    def __init__(self, models_dir):
        self.models_dir = models_dir
        self.ensemble = None
        self.severity_tfidf = None
        self.severity_model = None
        self.tfidf_m2 = None
        self.svd_m2 = None
        self._load_models()

    def _load_models(self):
        errors = []

        try:
            self.severity_tfidf = joblib.load(os.path.join(self.models_dir, 'model1_tfidf.pkl'))
            self.severity_model = joblib.load(os.path.join(self.models_dir, 'model1_model.pkl'))
            logger.info("✅ Module 1 loaded")
        except Exception as e:
            errors.append(f"Module 1: {e}")
            logger.error(f"❌ Module 1 failed: {e}")

        try:
            self.tfidf_m2 = joblib.load(os.path.join(self.models_dir, 'model2_tfidf.pkl'))
            self.svd_m2 = joblib.load(os.path.join(self.models_dir, 'model2_svd.pkl'))
            logger.info("✅ Module 2 loaded")
        except Exception as e:
            errors.append(f"Module 2: {e}")
            logger.error(f"❌ Module 2 failed: {e}")

        rf_m3 = tfidf_m3 = scaler_demo = le_3class = None
        try:
            rf_m3 = joblib.load(os.path.join(self.models_dir, 'model3_rf.pkl'))
            tfidf_m3 = joblib.load(os.path.join(self.models_dir, 'model3_tfidf.pkl'))
            scaler_demo = joblib.load(os.path.join(self.models_dir, 'model3_scaler.pkl'))
            le_3class = joblib.load(os.path.join(self.models_dir, 'model3_label_encoder.pkl'))
            logger.info("✅ Module 3 loaded")
        except Exception as e:
            errors.append(f"Module 3: {e}")
            logger.error(f"❌ Module 3 failed: {e}")

        sim_engine = None
        try:
            data = joblib.load(os.path.join(self.models_dir, 'model2_similarity_data.pkl'))
            sim_engine = SimilarityEngine(
                embeddings=data['embeddings'],
                texts=data['texts'],
                metadata=data.get('metadata')
            )
            if self.tfidf_m2 is not None and self.svd_m2 is not None:
                sim_engine._tfidf = self.tfidf_m2
                sim_engine._svd = self.svd_m2
            logger.info("✅ Similarity engine loaded")
        except Exception as e:
            errors.append(f"Similarity engine: {e}")
            logger.error(f"❌ Similarity engine failed: {e}")

        if rf_m3 is not None:
            self.ensemble = EnsembleRecommender(
                rf_model=rf_m3,
                similarity_engine=sim_engine,
                tfidf_vectorizer=tfidf_m3,
                scaler=scaler_demo,
                label_encoder=le_3class
            )
            logger.info("✅ Ensemble built")
        else:
            logger.error("❌ Ensemble could not be built")

        if errors:
            logger.warning(f"Load issues: {errors}")

    def predict_severity(self, text):
        if self.severity_tfidf is None or self.severity_model is None:
            return {'score': 2, 'level': 'Moderate pain', 'confidence': 0.0}
        X = self.severity_tfidf.transform([text])
        severity = int(self.severity_model.predict(X)[0])
        proba = self.severity_model.predict_proba(X)[0]
        levels = {0: 'No pain / Minimal', 1: 'Mild pain', 2: 'Moderate pain', 3: 'Severe pain', 4: 'Very severe pain'}
        return {'score': severity, 'level': levels.get(severity, 'Moderate pain'), 'confidence': float(np.max(proba))}

    def predict_treatment(self, symptom_text, age=30, gender=2, had_injury=0, duration_days=30):
        if self.ensemble is None:
            raise RuntimeError("Ensemble model not loaded")
        raw = self.ensemble.predict(symptom_text=symptom_text, age=age, gender=gender, had_injury=had_injury, duration_days=duration_days)
        primary = raw['recommendation']
        text_tfidf = self.ensemble.tfidf.transform([symptom_text])
        demo_scaled = self.ensemble.scaler.transform(np.array([[age, gender, had_injury, duration_days]]))
        X = hstack([text_tfidf, csr_matrix(demo_scaled)])
        rf_proba = self.ensemble.rf_model.predict_proba(X)[0]
        top3_indices = np.argsort(rf_proba)[-3:][::-1]
        alternatives = []
        for idx in top3_indices:
            label = self.ensemble.le.inverse_transform([idx])[0]
            if label != primary:
                alternatives.append({'treatment': label, 'treatment_label': TREATMENT_LABELS.get(label, label), 'confidence': float(rf_proba[idx])})
        similar_cases = []
        for s in raw.get('similar_cases', [])[:5]:
            meta = s.get('metadata', {}) or {}
            similar_cases.append({
                'symptom': str(s.get('text', ''))[:120],
                'treatment': meta.get('treatment_3class', 'UNKNOWN'),
                'treatment_label': TREATMENT_LABELS.get(meta.get('treatment_3class', ''), ''),
                'similarity': round(float(s.get('similarity', 0)), 3),
            })
        return {
            'primary': primary,
            'primary_label': TREATMENT_LABELS.get(primary, primary),
            'primary_description': TREATMENT_DESCRIPTIONS.get(primary, ''),
            'confidence': raw['confidence'],
            'alternatives': alternatives[:2],
            'similar_cases': similar_cases,
            'rf_confidence': raw['rf_confidence'],
        }

    def complete_analysis(self, symptom_text, age=30, gender=2, had_injury=0, duration=None):
        duration_days = parse_duration(duration)
        severity = self.predict_severity(symptom_text)
        treatment = self.predict_treatment(symptom_text, age, gender, had_injury, duration_days)
        return {
            'severity': severity,
            'treatment': {
                'recommendation': treatment['primary'],
                'recommendation_label': treatment['primary_label'],
                'description': treatment['primary_description'],
                'confidence': treatment['confidence'],
                'alternatives': treatment['alternatives'],
            },
            'evidence': {
                'similar_cases': treatment['similar_cases'],
                'match_quality': 'HIGH' if treatment['rf_confidence'] > 0.5 else 'MEDIUM',
                'total_matches': len(treatment['similar_cases']),
            }
        }