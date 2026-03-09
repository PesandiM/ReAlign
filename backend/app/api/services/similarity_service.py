import joblib
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from typing import List, Dict, Any, Tuple, Optional
import os
from pathlib import Path
import logging
import pandas as pd
from collections import Counter
from datetime import datetime
from app.core.config import settings

logger = logging.getLogger(__name__)

class SimilarityEngine:
    """Original SimilarityEngine class used for training"""
    
    def __init__(self, embeddings, texts, metadata=None):
        self.embeddings = embeddings
        self.texts = texts.reset_index(drop=True) if hasattr(texts, 'reset_index') else texts
        self.metadata = metadata
    
    def find_similar(self, query_text, top_k=5, similarity_threshold=0.3):
        """Find similar symptoms with proper thresholding"""
        # This is a simplified version - in production you'd use the actual TF-IDF/SVD
        # For now, we'll just return empty results since we're just loading the model
        return [], 'LOW'
    
    def get_recommendation(self, query_text, top_k=10):
        """Get treatment recommendation from similar cases"""
        # This is a simplified version
        return None

# Full SimilarityEngine class with all methods (from your notebook)
class FullSimilarityEngine:
    """Complete SimilarityEngine with all methods"""
    
    def __init__(self, embeddings, texts, metadata=None):
        self.embeddings = embeddings
        self.texts = texts.reset_index(drop=True) if hasattr(texts, 'reset_index') else texts
        self.metadata = metadata
    
    def find_similar(self, query_text, top_k=5, similarity_threshold=0.3):
        """Find similar symptoms with proper thresholding"""
        # In a real implementation, you'd use the TF-IDF and SVD transformers
        # But since we're just loading the model, we'll return a placeholder
        return [], 'LOW'
    
    def get_recommendation(self, query_text, top_k=10):
        """Get treatment recommendation from similar cases"""
        # Placeholder implementation
        return {
            'recommendation': 'UNKNOWN',
            'confidence': 0,
            'alternatives': [],
            'similar_cases': [],
            'total_matches': 0,
            'match_quality': 'LOW'
        }

class SimilarityService:
    """Service for finding similar cases"""
    
    def __init__(self):
        self.models_dir = settings.MODELS_DIR
        self.tfidf = None
        self.svd = None
        self.embeddings = None
        self.clinic_data = None
        self.engine = None
        self.load_models()
    
    def load_models(self):
        """Load similarity models and data"""
        try:
            self.tfidf = joblib.load(os.path.join(self.models_dir, 'model2_tfidf.pkl'))
            self.svd = joblib.load(os.path.join(self.models_dir, 'model2_svd.pkl'))
            
            # Load similarity engine (contains embeddings and clinic data)
            engine_path = os.path.join(self.models_dir, 'model2_similarity_engine.pkl')
            if os.path.exists(engine_path):
                # Try to load with the original class available
                self.engine = joblib.load(engine_path)
                self.embeddings = self.engine.embeddings
                self.clinic_data = self.engine.metadata if hasattr(self.engine, 'metadata') else None
                logger.info("✅ Similarity engine loaded successfully")
            else:
                logger.warning("Similarity engine not found. Using empty embeddings.")
                self.embeddings = np.array([])
                self.clinic_data = None
            
        except Exception as e:
            logger.error(f"❌ Error loading similarity models: {e}")
            self.embeddings = np.array([])
    
    def clean_text(self, text: str) -> str:
        """Basic text cleaning"""
        if not text:
            return ""
        import re
        text = str(text).lower()
        text = re.sub(r'[^a-zA-Z\s]', ' ', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text
    
    def find_similar(self, query_text: str, top_k: int = 5, 
                    threshold: float = 0.3) -> Tuple[List[Dict[str, Any]], str]:
        """Find similar historical cases"""
        if self.embeddings is None or len(self.embeddings) == 0:
            return [], 'NO_DATA'
        
        # Clean query
        cleaned = self.clean_text(query_text)
        
        # Transform query
        query_tfidf = self.tfidf.transform([cleaned])
        query_embedding = self.svd.transform(query_tfidf)
        
        # Calculate similarities
        similarities = cosine_similarity(query_embedding, self.embeddings)[0]
        
        # Get indices above threshold
        valid_indices = np.where(similarities >= threshold)[0]
        
        if len(valid_indices) == 0:
            # Return top matches with warning
            valid_indices = similarities.argsort()[-top_k:][::-1]
            confidence = 'LOW'
        else:
            sorted_indices = valid_indices[similarities[valid_indices].argsort()[::-1]]
            valid_indices = sorted_indices[:top_k]
            confidence = 'HIGH' if len(valid_indices) > 5 else 'MEDIUM'
        
        # Build results
        results = []
        for idx in valid_indices:
            if self.clinic_data is None or idx >= len(self.clinic_data):
                continue
                
            result = {
                'text': self.clinic_data.iloc[idx]['symptom_text'] if hasattr(self.clinic_data, 'iloc') else "Unknown",
                'similarity': float(similarities[idx]),
                'index': int(idx)
            }
            
            # Add metadata if available
            if self.clinic_data is not None and idx < len(self.clinic_data):
                if hasattr(self.clinic_data, 'iloc'):
                    row = self.clinic_data.iloc[idx]
                else:
                    row = self.clinic_data[idx] if isinstance(self.clinic_data, list) else {}
                
                result['metadata'] = {
                    'treatment_3class': row.get('treatment_3class', 'UNKNOWN') if hasattr(row, 'get') else 'UNKNOWN',
                    'age': row.get('age', None) if hasattr(row, 'get') else None,
                    'gender': row.get('gender', None) if hasattr(row, 'get') else None,
                    'had_injury': row.get('had_injury', 0) if hasattr(row, 'get') else 0
                }
            results.append(result)
        
        return results, confidence
    
    def get_recommendation(self, query_text: str, top_k: int = 10) -> Dict[str, Any]:
        """Get treatment recommendation from similar cases"""
        results, confidence = self.find_similar(query_text, top_k=top_k)
        
        if not results:
            return {
                'recommendation': 'UNKNOWN',
                'confidence': 0,
                'alternatives': [],
                'similar_cases': [],
                'total_matches': 0,
                'match_quality': confidence
            }
        
        # Count treatments
        treatments = []
        for r in results:
            if r.get('metadata') and 'treatment_3class' in r['metadata']:
                treatments.append(r['metadata']['treatment_3class'])
        
        if not treatments:
            return {
                'recommendation': 'UNKNOWN',
                'confidence': 0,
                'alternatives': [],
                'similar_cases': results[:3],
                'total_matches': len(results),
                'match_quality': confidence
            }
        
        counts = Counter(treatments)
        total = len(treatments)
        primary = counts.most_common(1)[0][0]
        
        return {
            'recommendation': primary,
            'confidence': counts.most_common(1)[0][1] / total,
            'alternatives': [t for t, c in counts.most_common(3)[1:]],
            'similar_cases': results[:3],
            'total_matches': total,
            'match_quality': confidence
        }