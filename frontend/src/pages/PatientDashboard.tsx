import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, Paper, Button, Chip,
  CircularProgress, Alert, Divider, Avatar, Stack, IconButton,
  TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions,
  Tab, Tabs
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AppSidebar from '../components/common/AppSidebar';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import SpaIcon from '@mui/icons-material/Spa';
import HealingIcon from '@mui/icons-material/Healing';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BlurCircularIcon from '@mui/icons-material/BlurCircular';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { authService } from '../services/authService';
import { patientService, PatientAppointment, PatientStats, PatientProfile } from '../services/patientService';

// ── helpers ─────────────────────────────────────────────────────────────────

const CATEGORY_ICON: Record<string, React.ReactNode> = {
  CHIRO:      <AccessibilityNewIcon fontSize="small" />,
  MASSAGE:    <SpaIcon fontSize="small" />,
  GUA_SHA:    <HealingIcon fontSize="small" />,
  STRETCHING: <FitnessCenterIcon fontSize="small" />,
  CUPPING:    <BlurCircularIcon fontSize="small" />,
  WELLNESS:   <SpaIcon fontSize="small" />,
  NUTRITION:  <LocalFloristIcon fontSize="small" />,
};

const CATEGORY_COLOR: Record<string, string> = {
  CHIRO: '#e3f0fb', MASSAGE: '#f3e8ff', GUA_SHA: '#fff3e0',
  STRETCHING: '#e8f5e9', CUPPING: '#fce4ec', WELLNESS: '#e0f7fa', NUTRITION: '#f9fbe7',
};

const STATUS_CONFIG: Record<string, { color: 'warning'|'success'|'error'|'default'; icon: React.ReactNode; label: string }> = {
  pending:   { color: 'warning', icon: <PendingIcon fontSize="small" />,      label: 'Pending' },
  confirmed: { color: 'success', icon: <CheckCircleIcon fontSize="small" />,  label: 'Confirmed' },
  cancelled: { color: 'error',   icon: <CancelIcon fontSize="small" />,       label: 'Cancelled' },
  completed: { color: 'default', icon: <CheckCircleIcon fontSize="small" />,  label: 'Completed' },
};

const TIME_SLOTS = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00',
];

// ── Appointment Card ─────────────────────────────────────────────────────────

const AppointmentCard: React.FC<{ apt: PatientAppointment; compact?: boolean }> = ({ apt, compact }) => {
  const cfg = STATUS_CONFIG[apt.status] || STATUS_CONFIG.pending;
  const treatmentName = apt.treatment?.name || 'Treatment';
  const category = apt.treatment?.category || '';

  return (
    <Card variant="outlined" sx={{
      borderRadius: 2, borderColor: '#e8e8e4',
      '&:hover': { boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }, transition: 'box-shadow 0.2s',
    }}>
      <CardContent sx={{ p: compact ? 1.5 : 2, '&:last-child': { pb: compact ? 1.5 : 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
          <Box sx={{ display: 'flex', gap: 1.5, flex: 1, minWidth: 0 }}>
            <Box sx={{
              width: 40, height: 40, borderRadius: 1.5, flexShrink: 0,
              bgcolor: CATEGORY_COLOR[category] || '#f5f5f5',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#555',
            }}>
              {CATEGORY_ICON[category] || <MedicalServicesIcon fontSize="small" />}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" fontWeight={600} noWrap>{treatmentName}</Typography>
              <Typography variant="caption" color="text.secondary">
                {new Date(apt.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                {' · '}{apt.time}
              </Typography>
              {apt.treatment?.duration && (
                <Typography variant="caption" color="text.secondary"> · {apt.treatment.duration} min</Typography>
              )}
            </Box>
          </Box>
          <Chip
            icon={cfg.icon as any}
            label={cfg.label}
            size="small"
            color={cfg.color}
            sx={{ flexShrink: 0, height: 24, fontSize: '11px' }}
          />
        </Box>
        {apt.rejection_reason && (
          <Typography variant="caption" color="error.main" sx={{ mt: 1, display: 'block' }}>
            Reason: {apt.rejection_reason}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

// ── Book Appointment Dialog ─────────────────────────────────────────────────

const BookAppointmentDialog: React.FC<{
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  patientId: string;
}> = ({ open, onClose, onSuccess, patientId }) => {
  const [treatments, setTreatments] = useState<any[]>([]);
  const [form, setForm] = useState({
    treatment_id: '',
    preferred_date: '',
    preferred_time: '',
    therapist_gender: 'No Preference',
    notes: '',
  });
  const [step, setStep] = useState(1); // 1: treatment, 2: date/time, 3: confirm
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      patientService.getTreatments().then(setTreatments).catch(() => {});
      setStep(1);
      setForm({ treatment_id: '', preferred_date: '', preferred_time: '', therapist_gender: 'No Preference', notes: '' });
      setError(null);
    }
  }, [open]);

  const selectedTreatment = treatments.find(t => t.treatment_id === form.treatment_id);

  // Min date = tomorrow
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateStr = minDate.toISOString().split('T')[0];

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      await patientService.requestAppointment(patientId, form);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e.message || 'Failed to submit request.');
    } finally {
      setSaving(false);
    }
  };

  const canNext1 = !!form.treatment_id;
  const canNext2 = !!form.preferred_date && !!form.preferred_time;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarMonthIcon sx={{ color: '#4d4f44' }} />
          <Typography fontWeight={700}>Book an Appointment</Typography>
        </Box>
        {/* Step indicator */}
        <Stack direction="row" spacing={0.5} sx={{ mt: 1.5 }}>
          {[1, 2, 3].map(s => (
            <Box key={s} sx={{
              height: 3, flex: 1, borderRadius: 2,
              bgcolor: s <= step ? '#4d4f44' : '#e0e0e0',
              transition: 'background-color 0.3s',
            }} />
          ))}
        </Stack>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Step 1: Choose treatment */}
        {step === 1 && (
          <Box>
            <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
              Select a Treatment
            </Typography>
            <Grid container spacing={1.5}>
              {treatments.map(t => (
                <Grid item xs={12} sm={6} key={t.treatment_id}>
                  <Card
                    variant="outlined"
                    onClick={() => setForm(f => ({ ...f, treatment_id: t.treatment_id }))}
                    sx={{
                      cursor: 'pointer', borderRadius: 2, p: 0,
                      borderColor: form.treatment_id === t.treatment_id ? '#4d4f44' : '#e0e0e0',
                      borderWidth: form.treatment_id === t.treatment_id ? 2 : 1,
                      bgcolor: form.treatment_id === t.treatment_id ? '#f5f5f2' : '#fff',
                      transition: 'all 0.15s',
                      '&:hover': { borderColor: '#4d4f44', bgcolor: '#f9f9f7' },
                    }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Box sx={{
                          width: 32, height: 32, borderRadius: 1,
                          bgcolor: CATEGORY_COLOR[t.category] || '#f5f5f5',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#555', flexShrink: 0,
                        }}>
                          {CATEGORY_ICON[t.category] || <MedicalServicesIcon sx={{ fontSize: 16 }} />}
                        </Box>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>{t.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t.duration} min · LKR {t.price?.toLocaleString()}
                          </Typography>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
            {treatments.length === 0 && (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                Loading treatments…
              </Typography>
            )}
          </Box>
        )}

        {/* Step 2: Date, time, therapist preference */}
        {step === 2 && (
          <Stack spacing={2.5}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: CATEGORY_COLOR[selectedTreatment?.category] || '#f5f5f5' }}>
              <Typography variant="body2" fontWeight={600}>{selectedTreatment?.name}</Typography>
              <Typography variant="caption" color="text.secondary">
                {selectedTreatment?.duration} min · LKR {selectedTreatment?.price?.toLocaleString()}
              </Typography>
            </Box>

            <TextField
              label="Preferred Date *"
              type="date"
              value={form.preferred_date}
              onChange={e => setForm(f => ({ ...f, preferred_date: e.target.value }))}
              inputProps={{ min: minDateStr }}
              InputLabelProps={{ shrink: true }}
              size="small" fullWidth
            />

            <TextField
              select
              label="Preferred Time *"
              value={form.preferred_time}
              onChange={e => setForm(f => ({ ...f, preferred_time: e.target.value }))}
              size="small" fullWidth
            >
              {TIME_SLOTS.map(t => (
                <MenuItem key={t} value={t}>{t}</MenuItem>
              ))}
            </TextField>

            <TextField
              select
              label="Therapist Gender Preference"
              value={form.therapist_gender}
              onChange={e => setForm(f => ({ ...f, therapist_gender: e.target.value }))}
              size="small" fullWidth
              helperText="We'll try to match your preference where possible"
            >
              {['No Preference', 'Female', 'Male'].map(g => (
                <MenuItem key={g} value={g}>{g}</MenuItem>
              ))}
            </TextField>

            <TextField
              label="Additional Notes"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              multiline rows={2}
              size="small" fullWidth
              placeholder="Any specific concerns or requests…"
            />
          </Stack>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <Stack spacing={2}>
            <Typography variant="subtitle2" fontWeight={600}>Confirm Your Request</Typography>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack spacing={1.5}>
                {[
                  { label: 'Treatment', value: selectedTreatment?.name },
                  { label: 'Category', value: selectedTreatment?.category },
                  { label: 'Duration', value: `${selectedTreatment?.duration} min` },
                  { label: 'Price', value: `LKR ${selectedTreatment?.price?.toLocaleString()}` },
                  { label: 'Date', value: new Date(form.preferred_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) },
                  { label: 'Time', value: form.preferred_time },
                  { label: 'Therapist Preference', value: form.therapist_gender },
                  ...(form.notes ? [{ label: 'Notes', value: form.notes }] : []),
                ].map(row => (
                  <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
                    <Typography variant="body2" color="text.secondary">{row.label}</Typography>
                    <Typography variant="body2" fontWeight={500} sx={{ textAlign: 'right' }}>{row.value}</Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
            <Alert severity="info" sx={{ fontSize: '12px' }}>
              Your request will be reviewed by our staff. You'll receive an Email confirmation once it's approved.
            </Alert>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        {step > 1 && (
          <Button onClick={() => setStep(s => s - 1)} sx={{ textTransform: 'none' }}>
            Back
          </Button>
        )}
        <Box sx={{ flex: 1 }} />
        <Button onClick={onClose} sx={{ textTransform: 'none' }}>Cancel</Button>
        {step < 3 && (
          <Button
            variant="contained"
            disabled={step === 1 ? !canNext1 : !canNext2}
            onClick={() => setStep(s => s + 1)}
            sx={{ textTransform: 'none', bgcolor: '#4d4f44', '&:hover': { bgcolor: '#6a6c60' } }}>
            Next
          </Button>
        )}
        {step === 3 && (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={saving}
            sx={{ textTransform: 'none', bgcolor: '#4d4f44', '&:hover': { bgcolor: '#6a6c60' } }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Submit Request'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// ── Overview ─────────────────────────────────────────────────────────────────

const Overview: React.FC<{ patientId: string }> = ({ patientId }) => {
  const user = authService.getCurrentUser();
  const navigate = useNavigate();
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [upcoming, setUpcoming] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookOpen, setBookOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, u] = await Promise.all([
        patientService.getStats(patientId).catch(() => null),
        patientService.getUpcomingAppointments(patientId).catch(() => []),
      ]);
      setStats(s);
      setUpcoming(u);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [patientId]);

  const statCards = [
    { label: 'Upcoming', value: stats?.upcoming_appointments ?? 0, color: '#4d7c4f', bg: '#e8f5e9' },
    { label: 'Completed', value: stats?.completed_appointments ?? 0, color: '#1565c0', bg: '#e3f2fd' },
    { label: 'Total Visits', value: stats?.total_appointments ?? 0, color: '#6a1b9a', bg: '#f3e5f5' },
  ];

  return (
    <Box>
      {/* Welcome */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={700} gutterBottom>
            Welcome back, {user?.name?.split(' ')[0] || 'there'} 
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your appointments and track your treatment progress
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddCircleOutlineIcon />}
          onClick={() => setBookOpen(true)}
          sx={{ bgcolor: '#4d4f44', '&:hover': { bgcolor: '#6a6c60' }, textTransform: 'none', borderRadius: 2 }}>
          Book Appointment
        </Button>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {statCards.map(s => (
          <Grid item xs={12} sm={4} key={s.label}>
            <Card sx={{ borderRadius: 2, border: 'none', boxShadow: '0 1px 4px rgba(0,0,0,0.07)' }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="h3" fontWeight={700} sx={{ color: s.color, lineHeight: 1 }}>
                      {loading ? '—' : s.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{s.label}</Typography>
                  </Box>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: s.bg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CalendarMonthIcon sx={{ color: s.color }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Upcoming */}
      <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" fontWeight={700}>Upcoming Appointments</Typography>
          <Button size="small" onClick={() => navigate('/patient/appointments')}
            sx={{ textTransform: 'none', color: '#4d4f44' }}>
            View all
          </Button>
        </Box>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress size={28} /></Box>
        ) : upcoming.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 5 }}>
            <EventNoteIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary" variant="body2">No upcoming appointments</Typography>
            <Button size="small" variant="outlined" sx={{ mt: 2, textTransform: 'none' }}
              onClick={() => setBookOpen(true)}>
              Book now
            </Button>
          </Box>
        ) : (
          <Stack spacing={1.5}>
            {upcoming.slice(0, 3).map(apt => (
              <AppointmentCard key={apt.appointment_id} apt={apt} compact />
            ))}
          </Stack>
        )}
      </Paper>

      <BookAppointmentDialog
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        onSuccess={load}
        patientId={patientId}
      />
    </Box>
  );
};

// ── Appointments Page ────────────────────────────────────────────────────────

const AppointmentsPage: React.FC<{ patientId: string }> = ({ patientId }) => {
  const [tab, setTab] = useState(0);
  const [upcoming, setUpcoming] = useState<PatientAppointment[]>([]);
  const [past, setPast] = useState<PatientAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookOpen, setBookOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    const [u, p] = await Promise.all([
      patientService.getUpcomingAppointments(patientId).catch(() => []),
      patientService.getPastAppointments(patientId).catch(() => []),
    ]);
    setUpcoming(u);
    setPast(p);
    setLoading(false);
  };

  useEffect(() => { load(); }, [patientId]);

  const list = tab === 0 ? upcoming : past;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>My Appointments</Typography>
          <Typography variant="body2" color="text.secondary">Track your booking requests and visit history</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddCircleOutlineIcon />}
          onClick={() => setBookOpen(true)}
          sx={{ bgcolor: '#4d4f44', '&:hover': { bgcolor: '#6a6c60' }, textTransform: 'none', borderRadius: 2 }}>
          New Booking
        </Button>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: '1px solid #eee', px: 2,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, minWidth: 120 },
            '& .Mui-selected': { color: '#4d4f44' },
            '& .MuiTabs-indicator': { bgcolor: '#4d4f44' },
          }}>
          <Tab label={`Upcoming (${upcoming.length})`} />
          <Tab label={`Past (${past.length})`} />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : list.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <EventNoteIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
              <Typography color="text.secondary">
                {tab === 0 ? 'No upcoming appointments' : 'No past appointments'}
              </Typography>
              {tab === 0 && (
                <Button size="small" variant="outlined" sx={{ mt: 2, textTransform: 'none' }}
                  onClick={() => setBookOpen(true)}>Book now</Button>
              )}
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {list.map(apt => <AppointmentCard key={apt.appointment_id} apt={apt} />)}
            </Stack>
          )}
        </Box>
      </Paper>

      <BookAppointmentDialog
        open={bookOpen}
        onClose={() => setBookOpen(false)}
        onSuccess={load}
        patientId={patientId}
      />
    </Box>
  );
};

// ── History Page ─────────────────────────────────────────────────────────────

const HistoryPage: React.FC<{ patientId: string }> = ({ patientId }) => {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [symptoms, setSymptoms] = useState<any[]>([]);
  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      patientService.getRecommendations(patientId).catch(() => []),
      patientService.getSymptomHistory(patientId).catch(() => []),
    ]).then(([r, s]) => { setRecommendations(r); setSymptoms(s); setLoading(false); });
  }, [patientId]);

  const SEVERITY_COLOR: Record<number, string> = { 0: '#4caf50', 1: '#8bc34a', 2: '#ff9800', 3: '#f44336', 4: '#9c27b0' };
  const SEVERITY_LABEL: Record<number, string> = { 0: 'Minimal', 1: 'Mild', 2: 'Moderate', 3: 'Severe', 4: 'Critical' };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>Treatment History</Typography>
        <Typography variant="body2" color="text.secondary">Your symptom checks and AI treatment recommendations</Typography>
      </Box>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}
          sx={{ borderBottom: '1px solid #eee', px: 2,
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 },
            '& .Mui-selected': { color: '#4d4f44' },
            '& .MuiTabs-indicator': { bgcolor: '#4d4f44' },
          }}>
          <Tab label={`Recommendations (${recommendations.length})`} />
          <Tab label={`Symptom Checks (${symptoms.length})`} />
        </Tabs>
        <Box sx={{ p: 3 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : tab === 0 ? (
            recommendations.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
                No recommendations yet. Try a symptom check!
              </Typography>
            ) : (
              <Stack spacing={2}>
                {recommendations.map((rec, i) => (
                  <Card key={i} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                        <Typography variant="body2" fontWeight={600}>
                          {rec.recommended_treatment || rec.treatment_category || 'Recommendation'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {rec.created_at ? new Date(rec.created_at).toLocaleDateString() : ''}
                        </Typography>
                      </Box>
                      {rec.severity_score !== undefined && (
                        <Chip
                          label={`${SEVERITY_LABEL[rec.severity_score] || 'Unknown'} severity`}
                          size="small"
                          sx={{ bgcolor: SEVERITY_COLOR[rec.severity_score] + '22',
                            color: SEVERITY_COLOR[rec.severity_score], fontWeight: 600, mr: 1, mb: 1 }}
                        />
                      )}
                      {rec.confidence && (
                        <Chip label={`${Math.round(rec.confidence * 100)}% confidence`}
                          size="small" variant="outlined" sx={{ fontSize: '11px' }} />
                      )}
                      {rec.symptom_text && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                          "{rec.symptom_text}"
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )
          ) : (
            symptoms.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 6 }}>
                No symptom checks on record.
              </Typography>
            ) : (
              <Stack spacing={2}>
                {symptoms.map((s, i) => (
                  <Card key={i} variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2" fontWeight={600}>Symptom Check</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.created_at ? new Date(s.created_at).toLocaleDateString() : ''}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {s.symptom_text || s.description || 'No description'}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )
          )}
        </Box>
      </Paper>
    </Box>
  );
};

// ── Profile Page ─────────────────────────────────────────────────────────────

const ProfilePage: React.FC<{ patientId: string }> = ({ patientId }) => {
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [form, setForm] = useState({ name: '', contact_no: '', age: 0, gender: '' });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const normaliseGender = (g: string): string => {
    if (!g) return '';
    const map: Record<string, string> = {
      'male': 'Male', 'female': 'Female',
      'non binary': 'Non Binary', 'non-binary': 'Non Binary', 'nonbinary': 'Non Binary',
    };
    return map[g.toLowerCase().trim()] ?? g;
  };

    useEffect(() => {
        patientService.getProfile(patientId)
            .then(p => {
                setProfile(p);
                setForm({ name: p.name, contact_no: p.contact_no, age: p.age, gender: normaliseGender(p.gender) });
            })
        .catch(() => setAlert({ type: 'error', msg: 'Failed to load profile.' }))
        .finally(() => setLoading(false));
    }, [patientId]);


  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await patientService.updateProfile(patientId, form);
      setProfile(updated);
      setEditing(false);
      setAlert({ type: 'success', msg: 'Profile updated successfully.' });
    } catch (e: any) {
      setAlert({ type: 'error', msg: e.message || 'Update failed.' });
    } finally {
      setSaving(false);
    }
  };

  const initials = (name: string) => name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  return (
    <Box>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>My Profile</Typography>

      {alert && <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 2 }}>{alert.msg}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><CircularProgress /></Box>
      ) : (
        <Grid container spacing={3}>
          {/* Avatar card */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center' }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: '#6a8d73', fontSize: 28, fontWeight: 700, mx: 'auto', mb: 2 }}>
                {profile ? initials(profile.name) : 'P'}
              </Avatar>
              <Typography variant="h6" fontWeight={700}>{profile?.name}</Typography>
              <Typography variant="body2" color="text.secondary">{profile?.email}</Typography>
              <Chip label="Patient" size="small" sx={{ mt: 1, bgcolor: '#e8f5e9', color: '#4d7c4f', fontWeight: 600 }} />
              <Divider sx={{ my: 2 }} />
              <Stack spacing={1} sx={{ textAlign: 'left' }}>
                {[
                  { label: 'Age', value: `${profile?.age} years` },
                  { label: 'Gender', value: profile?.gender },
                  { label: 'Contact', value: profile?.contact_no },
                ].map(row => (
                  <Box key={row.label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary">{row.label}</Typography>
                    <Typography variant="caption" fontWeight={500}>{row.value || '—'}</Typography>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Grid>

          {/* Edit form */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3, borderRadius: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={700}>Personal Information</Typography>
                {!editing ? (
                  <Button startIcon={<EditIcon />} onClick={() => setEditing(true)}
                    sx={{ textTransform: 'none', color: '#4d4f44' }}>
                    Edit
                  </Button>
                ) : (
                  <Stack direction="row" spacing={1}>
                    <Button onClick={() => setEditing(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
                    <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSave} disabled={saving}
                      sx={{ textTransform: 'none', bgcolor: '#4d4f44', '&:hover': { bgcolor: '#6a6c60' } }}>
                      {saving ? <CircularProgress size={18} color="inherit" /> : 'Save'}
                    </Button>
                  </Stack>
                )}
              </Box>

              <Stack spacing={2.5}>
                <TextField label="Full Name" value={form.name} size="small" fullWidth disabled={!editing}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                <TextField label="Email" value={profile?.email || ''} size="small" fullWidth disabled
                  helperText="Email cannot be changed" />
                <Stack direction="row" spacing={2}>
                  <TextField label="Contact Number" value={form.contact_no} size="small" fullWidth disabled={!editing}
                    onChange={e => setForm(f => ({ ...f, contact_no: e.target.value }))} />
                  <TextField label="Age" type="number" value={form.age} size="small" fullWidth disabled={!editing}
                    inputProps={{ min: 1, max: 120 }}
                    onChange={e => setForm(f => ({ ...f, age: Number(e.target.value) }))} />
                </Stack>
                <TextField select label="Gender" value={form.gender} size="small" fullWidth disabled={!editing}
                  onChange={e => setForm(f => ({ ...f, gender: e.target.value }))}>
                  {['Male', 'Female', 'Non Binary'].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                </TextField>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
};

// ── Root Dashboard ────────────────────────────────────────────────────────────

const PatientDashboard: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  // Use patient_id from login response; fall back to userId for legacy accounts
  const patientId = (user as any)?.patient_id || user?.userId || '';

  const handleLogout = () => {
    authService.logout();
    navigate('/');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f7f7f5' }}>
      <AppSidebar
        mobileOpen={mobileOpen}
        onDrawerToggle={() => setMobileOpen(prev => !prev)}
        userRole="patient"
        onLogout={handleLogout}
      />

      {/* Main content — offset by sidebar width (280px on sm+) */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, ml: { sm: '100px' } }}>
        {/* Mobile topbar */}
        <Box sx={{
          display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 1,
          px: 2, py: 1.5, bgcolor: '#4d4f44', position: 'sticky', top: 0, zIndex: 100,
        }}>
          <IconButton onClick={() => setMobileOpen(true)} sx={{ color: '#fff' }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" fontWeight={700} sx={{ color: '#fff' }}>
            Patient Portal
          </Typography>
        </Box>

        <Box sx={{ flex: 1, p: { xs: 2, md: 4 }, maxWidth: 900, width: '100%', mx: 'auto' }}>
          <Routes>
            <Route path="/"             element={<Overview patientId={patientId} />} />
            <Route path="/appointments" element={<AppointmentsPage patientId={patientId} />} />
            <Route path="/history"      element={<HistoryPage patientId={patientId} />} />
            <Route path="/profile"      element={<ProfilePage patientId={patientId} />} />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
};

export default PatientDashboard;