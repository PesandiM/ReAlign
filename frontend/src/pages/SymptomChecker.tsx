import React, { useState } from 'react';
import {
  Container, Typography, TextField, Button, Box, Paper, Grid, Chip, Alert,
  CircularProgress, FormControl, InputLabel, Select, MenuItem, IconButton,
  Divider, LinearProgress, Card, CardContent, Avatar
} from '@mui/material';
import { styled } from '@mui/material/styles';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import SpaIcon from '@mui/icons-material/Spa';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import { predictionService } from '../services/predictionService';
import LoginModal from '../components/common/LoginModal';

// ── Styled components ────────────────────────────────────────────────────────

const SymptomInput = styled(TextField)(() => ({
  '& .MuiOutlinedInput-root': { backgroundColor: 'white' },
}));

// Qualitative label chip — NO raw % shown to examiner/user
const MatchChip = styled(Chip)<{ matchlevel: 'high' | 'medium' | 'low' }>(({ theme, matchlevel }) => ({
  backgroundColor:
    matchlevel === 'high'   ? theme.palette.success.light :
    matchlevel === 'medium' ? theme.palette.warning.light :
    theme.palette.grey[300],
  color:
    matchlevel === 'high'   ? theme.palette.success.dark :
    matchlevel === 'medium' ? theme.palette.warning.dark :
    theme.palette.grey[800],
  fontWeight: 'bold',
}));

const TreatmentIcon = styled(Avatar)(({ theme }) => ({
  backgroundColor: theme.palette.primary.light,
  color: theme.palette.primary.dark,
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Convert 0–1 confidence to a qualitative label — never show raw % */
const confidenceToLabel = (confidence: number): { label: string; level: 'high' | 'medium' | 'low' } => {
  if (confidence >= 0.65) return { label: 'Strong Match',    level: 'high' };
  if (confidence >= 0.45) return { label: 'Good Match',      level: 'medium' };
  if (confidence >= 0.30) return { label: 'Possible Match',  level: 'medium' };
  return                         { label: 'Suggested',        level: 'low' };
};

/** Severity score → friendly label only */
const severityToLabel = (level: string): { label: string; color: 'success' | 'warning' | 'error' | 'info' } => {
  const l = level?.toLowerCase() || '';
  if (l.includes('minimal') || l.includes('mild'))   return { label: 'Mild Discomfort',    color: 'success' };
  if (l.includes('moderate'))                         return { label: 'Moderate Pain',      color: 'warning' };
  if (l.includes('severe') || l.includes('critical')) return { label: 'Significant Pain',   color: 'error' };
  return                                                      { label: 'Discomfort Noted',   color: 'info' };
};

const formatTreatmentName = (treatment: string) => {
  switch (treatment) {
    case 'MANUAL_THERAPY': return 'Chiropractic / Physiotherapy';
    case 'SOFT_TISSUE':    return 'Massage / Soft Tissue Therapy';
    case 'MOVEMENT_OTHER': return 'Movement Therapy / Wellness';
    default:               return treatment;
  }
};

const getTreatmentIcon = (treatment: string) => {
  switch (treatment?.toUpperCase()) {
    case 'MANUAL_THERAPY': return <SpaIcon />;
    case 'SOFT_TISSUE':    return <SelfImprovementIcon />;
    case 'MOVEMENT_OTHER': return <FitnessCenterIcon />;
    default:               return <SpaIcon />;
  }
};

// ── Types ────────────────────────────────────────────────────────────────────

interface PredictionData {
  severity?: { score: number; level: string; confidence: number };
  treatment: {
    recommendation: string;
    recommendation_label?: string;
    description?: string;
    confidence: number;
    alternatives: Array<{ treatment: string; treatment_label?: string; confidence: number }>;
    staff_review_required?: boolean;
  };
  evidence: {
    similar_cases: Array<{ symptom: string; treatment: string; similarity: number }>;
    match_quality: string;
    total_matches: number;
  };
  hernia_warning?: string;
}

// ── Component ────────────────────────────────────────────────────────────────

const SymptomChecker: React.FC = () => {
  const [symptoms, setSymptoms]           = useState('');
  const [age, setAge]                     = useState('');
  const [gender, setGender]               = useState('');
  const [surgeryHistory, setSurgeryHistory] = useState('');
  const [injuryHistory, setInjuryHistory] = useState('');
  const [duration, setDuration]           = useState('');
  const [isRecording, setIsRecording]     = useState(false);
  const [prediction, setPrediction]       = useState<PredictionData | null>(null);
  const [loading, setLoading]             = useState(false);
  const [safetyAlert, setSafetyAlert]     = useState<string | null>(null);
  const [loginOpen, setLoginOpen]         = useState(false);
  const [step, setStep]                   = useState(1);
  const [error, setError]                 = useState<string | null>(null);

  const genderMap: Record<string, number> = {
    female: 1, male: 2, 'non-binary': 3, 'prefer-not': 3,
  };

  const handleVoiceInput = () => {
    setIsRecording(!isRecording);
    if (!isRecording && 'webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onstart  = () => setIsRecording(true);
      recognition.onresult = (event: any) => { setSymptoms(event.results[0][0].transcript); setIsRecording(false); };
      recognition.onerror  = () => setIsRecording(false);
      recognition.onend    = () => setIsRecording(false);
      recognition.start();
    } else {
      setTimeout(() => { setSymptoms('Sharp lower back pain when bending, started 2 weeks ago'); setIsRecording(false); }, 2000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStep(2);
    setError(null);
    try {
      const result = await predictionService.completeAnalysis({
        symptom_text: symptoms,
        age: parseInt(age),
        gender: genderMap[gender] || 3,
        had_injury: injuryHistory ? 1 : 0,
        duration,
        // patient_id not available on public page — anonymous check
      });
      setPrediction(result.data);

      // Safety rules — also check surgery/injury fields entered by user
      const rec = result.data.treatment.recommendation;
      if (surgeryHistory.toLowerCase().includes('hernia')) {
        setSafetyAlert(null); // hernia_warning shown inline in results
      } else if (injuryHistory.toLowerCase().includes('fracture') && rec === 'MANUAL_THERAPY') {
        setSafetyAlert('⚠️ Please inform our therapist about your fracture history before your session.');
      } else if (surgeryHistory.trim() && rec === 'MANUAL_THERAPY') {
        setSafetyAlert('⚠️ Please inform our therapist about your surgery history before booking.');
      } else {
        setSafetyAlert(null);
      }
      setStep(3);
    } catch {
      setError('Analysis failed. Please try again.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleTryAgain = () => {
    setStep(1);
    setPrediction(null);
    setError(null);
    setSafetyAlert(null);
    setSymptoms('');
    setAge('');
    setGender('');
    setSurgeryHistory('');
    setInjuryHistory('');
    setDuration('');
  };

  return (
    <Box sx={{ backgroundColor: '#e5e2d6', minHeight: '100vh' }}>
      <Header onLoginClick={() => setLoginOpen(true)} />

      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
          Home &gt; Symptom Checker
        </Typography>

        {/* Progress steps */}
        <Box sx={{ mb: 4 }}>
          <Grid container spacing={2} alignItems="center">
            {['Describe Symptoms', 'AI Analysis', 'Results'].map((label, i) => (
              <Grid item xs={4} key={label}>
                <Typography variant="body2" align="center"
                  color={step >= i + 1 ? 'primary' : 'textSecondary'}
                  sx={{ fontWeight: step >= i + 1 ? 'bold' : 'normal' }}>
                  {i + 1}. {label}
                </Typography>
                {step === i + 1 && <LinearProgress color="primary" sx={{ mt: 1 }} />}
              </Grid>
            ))}
          </Grid>
        </Box>

        <Grid container spacing={4}>
          {/* ── Left: Form ───────────────────────────────────────────────── */}
          <Grid item xs={12} md={5}>
            <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h5" gutterBottom color="primary">
                Describe Your Symptoms
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                Please provide as much detail as possible for accurate analysis
              </Typography>

              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <SymptomInput fullWidth label="What are you experiencing? *" multiline rows={4}
                      value={symptoms} onChange={e => setSymptoms(e.target.value)}
                      placeholder="e.g., Sharp lower back pain when bending, neck stiffness…"
                      required disabled={loading || step > 1}
                      InputProps={{
                        endAdornment: (
                          <IconButton onClick={handleVoiceInput} color={isRecording ? 'error' : 'default'} sx={{ mr: 1 }}>
                            {isRecording ? <MicOffIcon /> : <MicIcon />}
                          </IconButton>
                        ),
                      }}
                    />
                    {isRecording && (
                      <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                        🎤 Listening... Speak clearly
                      </Typography>
                    )}
                  </Grid>

                  <Grid item xs={6}>
                    <TextField fullWidth label="Age" type="number" value={age}
                      onChange={e => setAge(e.target.value)} required
                      disabled={loading || step > 1} inputProps={{ min: 0, max: 120 }} />
                  </Grid>

                  <Grid item xs={6}>
                    <FormControl fullWidth required disabled={loading || step > 1}>
                      <InputLabel>Gender</InputLabel>
                      <Select value={gender} label="Gender" onChange={e => setGender(e.target.value)}>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="non-binary">Non-Binary</MenuItem>
                        <MenuItem value="prefer-not">Prefer not to say</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField fullWidth label="How long have you had these symptoms?"
                      value={duration} onChange={e => setDuration(e.target.value)}
                      placeholder="e.g., 2 weeks, 3 months" disabled={loading || step > 1} />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>Medical History (Optional)</Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <TextField fullWidth label="Surgery History" value={surgeryHistory}
                      onChange={e => setSurgeryHistory(e.target.value)}
                      placeholder="e.g., Hernia surgery 3 months ago"
                      disabled={loading || step > 1} size="small" />
                  </Grid>

                  <Grid item xs={12}>
                    <TextField fullWidth label="Injury History" value={injuryHistory}
                      onChange={e => setInjuryHistory(e.target.value)}
                      placeholder="e.g., Sports injury, fall, accident"
                      disabled={loading || step > 1} size="small" />
                  </Grid>

                  <Grid item xs={12}>
                    <Button type="submit" variant="contained" size="large" fullWidth
                      disabled={loading || !symptoms || !age || !gender || step > 1}
                      sx={{ py: 1.5 }}>
                      {loading ? (
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <CircularProgress size={24} sx={{ mr: 1, color: 'white' }} />
                          Analyzing…
                        </Box>
                      ) : step > 1 ? 'Already Analyzed' : 'Analyze Symptoms'}
                    </Button>
                  </Grid>
                </Grid>
              </form>

              {error && <Alert severity="error" sx={{ mt: 3 }}>{error}</Alert>}

              <Box sx={{ mt: 3 }}>
                <Divider />
                <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
                  *Your data is secure and confidential. No login required for symptom check.
                </Typography>
              </Box>
            </Paper>
          </Grid>

          {/* ── Right: Results ───────────────────────────────────────────── */}
          <Grid item xs={12} md={7}>
            {safetyAlert && (
              <Alert severity="warning" sx={{ mb: 3 }} onClose={() => setSafetyAlert(null)}>
                {safetyAlert}
              </Alert>
            )}

            {!prediction && !loading && step === 1 && (
              <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'white' }}>
                <SpaIcon sx={{ fontSize: 60, color: 'primary.light', mb: 2 }} />
                <Typography variant="h6" gutterBottom>Ready to analyse your symptoms</Typography>
                <Typography variant="body2" color="textSecondary">
                  Fill in the form and click "Analyse Symptoms" to get your personalised treatment recommendations
                </Typography>
              </Paper>
            )}

            {loading && (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress size={60} sx={{ mb: 2 }} />
                <Typography variant="h6" gutterBottom>AI is analysing your symptoms</Typography>
                <Typography variant="body2" color="textSecondary">This will only take a moment…</Typography>
              </Paper>
            )}

            {prediction && !loading && (
              <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h5" gutterBottom color="primary">Your Results</Typography>
                <Typography variant="body2" color="textSecondary" paragraph>
                  Based on your symptoms, here are our AI-powered recommendations
                </Typography>

                {/* ── Hernia / contraindication warning ── */}
                {prediction.hernia_warning && (
                  <Alert severity="error" sx={{ mb: 3 }} icon={false}>
                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                      ⚠️ We Are Unable to Treat at This Time
                    </Typography>
                    <Typography variant="body2">{prediction.hernia_warning}</Typography>
                  </Alert>
                )}

                {/* ── Staff review flag ── */}
                {prediction.treatment.staff_review_required && !prediction.hernia_warning && (
                  <Alert severity="warning" sx={{ mb: 3 }}>
                    <Typography variant="subtitle2">Staff Review Recommended</Typography>
                    <Typography variant="body2">
                      Given your injury history, we recommend discussing this recommendation
                      with our staff before booking.
                    </Typography>
                  </Alert>
                )}

                {/* ── Severity — qualitative only, no % ── */}
                {prediction.severity && (() => {
                  const { label, color } = severityToLabel(prediction.severity.level);
                  return (
                    <Alert severity={color} icon={<CheckCircleIcon />} sx={{ mb: 3 }}>
                      <Typography variant="subtitle2">Pain Assessment: {label}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Our AI has assessed the severity of your reported symptoms.
                      </Typography>
                    </Alert>
                  );
                })()}

                {/* ── Primary recommendation ── */}
                <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                  PRIMARY RECOMMENDATION
                </Typography>
                <Card variant="outlined" sx={{
                  mb: 3, borderColor: 'primary.main', borderWidth: 2,
                  bgcolor: 'rgba(46,125,50,0.05)',
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <TreatmentIcon>{getTreatmentIcon(prediction.treatment.recommendation)}</TreatmentIcon>
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="h6">
                            {prediction.treatment.recommendation_label ||
                              formatTreatmentName(prediction.treatment.recommendation)}
                          </Typography>
                          {(() => {
                            const { label, level } = confidenceToLabel(prediction.treatment.confidence);
                            return <MatchChip label={label} matchlevel={level} size="small" />;
                          })()}
                        </Box>
                        {prediction.treatment.description && (
                          <Typography variant="body2" color="textSecondary" paragraph>
                            {prediction.treatment.description}
                          </Typography>
                        )}
                        <Typography variant="body2" color="textSecondary">
                          Based on {prediction.evidence.total_matches} similar cases
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          Match quality: {prediction.evidence.match_quality}
                        </Typography>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

                {/* ── Alternatives — qualitative labels only ── */}
                {prediction.treatment.alternatives?.length > 0 && (
                  <>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                      ALTERNATIVE OPTIONS
                    </Typography>
                    {prediction.treatment.alternatives.map((alt, i) => {
                      const { label, level } = confidenceToLabel(alt.confidence);
                      return (
                        <Card key={i} variant="outlined" sx={{ mb: 2 }}>
                          <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                              <TreatmentIcon>{getTreatmentIcon(alt.treatment)}</TreatmentIcon>
                              <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="subtitle1">
                                  {alt.treatment_label || formatTreatmentName(alt.treatment)}
                                </Typography>
                                <MatchChip label={label} matchlevel={level} size="small" />
                              </Box>
                            </Box>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </>
                )}

                {/* ── Similar cases — similarity % also hidden ── */}
                {prediction.evidence.similar_cases?.length > 0 && (
                  <Paper variant="outlined" sx={{ p: 2, mt: 3, bgcolor: 'grey.50' }}>
                    <Typography variant="subtitle2" gutterBottom>📊 Similar Cases</Typography>
                    {prediction.evidence.similar_cases.slice(0, 3).map((c, i) => (
                      <Box key={i} sx={{ mb: 1 }}>
                        <Typography variant="body2" color="textSecondary">
                          • "{c.symptom}" → {formatTreatmentName(c.treatment)}
                        </Typography>
                      </Box>
                    ))}
                  </Paper>
                )}

                {/* ── CTA ── */}
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Typography variant="body2" paragraph>
                    Ready to book an appointment with one of our therapists?
                  </Typography>
                  <Button variant="contained" color="secondary" size="large"
                    onClick={() => setLoginOpen(true)} sx={{ mr: 2 }}>
                    Login to Book
                  </Button>
                  <Button variant="outlined" size="large" onClick={handleTryAgain}>
                    Try Another Symptom
                  </Button>
                </Box>
              </Paper>
            )}
          </Grid>
        </Grid>
      </Container>

      <Footer />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </Box>
  );
};

export default SymptomChecker;