import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, Button, Chip,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  IconButton, Tooltip, CircularProgress, Alert, Stack, Divider,
  Avatar, Select, MenuItem, FormControl, InputLabel, Table,
  TableBody, TableCell, TableContainer, TableHead, TableRow,
  ToggleButton, ToggleButtonGroup, Badge
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PersonIcon from '@mui/icons-material/Person';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import BlockIcon from '@mui/icons-material/Block';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { staffService, Therapist } from '../services/staffService';

// ── Constants ────────────────────────────────────────────────────────────────

const TIME_SLOTS = [
  '08:00','08:30','09:00','09:30','10:00','10:30','11:00','11:30',
  '13:00','13:30','14:00','14:30','15:00','15:30','16:00','16:30','17:00',
];

const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

const avatarColor = (name: string) => {
  const colors = ['#4d4f44','#6a8d73','#b5835a','#5b7fa6','#8d6a9f'];
  return colors[name.charCodeAt(0) % colors.length];
};

const initials = (name: string) =>
  name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

// ── Types ────────────────────────────────────────────────────────────────────

interface Slot {
  availability_id: string;
  therapist_id: string;
  date: string;
  start_time: string;
  end_time: string;
  is_booked: boolean;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const getWeekDates = (offset: number): Date[] => {
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - now.getDay() + 1 + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

const fmt = (d: Date) => d.toISOString().split('T')[0];
const fmtDisplay = (d: Date) =>
  d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });

// ── Main Component ────────────────────────────────────────────────────────────

const TherapistAvailability: React.FC = () => {
  const [therapists, setTherapists]       = useState<Therapist[]>([]);
  const [selected, setSelected]           = useState<Therapist | null>(null);
  const [slots, setSlots]                 = useState<Slot[]>([]);
  const [loading, setLoading]             = useState(false);
  const [slotsLoading, setSlotsLoading]   = useState(false);
  const [weekOffset, setWeekOffset]       = useState(0);
  const [addOpen, setAddOpen]             = useState(false);
  const [alert, setAlert]                 = useState<{ type: 'success'|'error'; msg: string } | null>(null);
  const [saving, setSaving]               = useState(false);
  const [view, setView]                   = useState<'grid' | 'list'>('grid');

  // Add slot form
  const [addForm, setAddForm] = useState({ date: '', start_time: '', end_time: '' });

  const weekDates = getWeekDates(weekOffset);

  // ── Load therapists ────────────────────────────────────────────────────────

  useEffect(() => {
    setLoading(true);
    staffService.getTherapists(false)
      .then(data => { setTherapists(data); if (data.length > 0) setSelected(data[0]); })
      .catch(() => setAlert({ type: 'error', msg: 'Failed to load therapists.' }))
      .finally(() => setLoading(false));
  }, []);

  // Check URL param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tid = params.get('therapist');
    if (tid && therapists.length > 0) {
      const t = therapists.find(x => x.therapist_id === tid);
      if (t) setSelected(t);
    }
  }, [therapists]);

  // ── Load slots for selected therapist ─────────────────────────────────────

  useEffect(() => {
    if (!selected) return;
    setSlotsLoading(true);
    fetch(`http://localhost:8000/api/v1/therapists/${selected.therapist_id}/availability`, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(r => r.json())
      .then(data => setSlots(Array.isArray(data) ? data : []))
      .catch(() => setAlert({ type: 'error', msg: 'Failed to load slots.' }))
      .finally(() => setSlotsLoading(false));
  }, [selected]);

  // ── Add slot ──────────────────────────────────────────────────────────────

  const handleAddSlot = async () => {
    if (!selected || !addForm.date || !addForm.start_time || !addForm.end_time) return;
    setSaving(true);
    try {
      const res = await fetch(
        `http://localhost:8000/api/v1/therapists/${selected.therapist_id}/availability`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({ ...addForm, is_booked: false }),
        }
      );
      if (!res.ok) throw new Error('Failed to add slot.');
      const newSlot = await res.json();
      setSlots(prev => [...prev, newSlot]);
      setAlert({ type: 'success', msg: 'Availability slot added.' });
      setAddOpen(false);
      setAddForm({ date: '', start_time: '', end_time: '' });
    } catch (e: any) {
      setAlert({ type: 'error', msg: e.message });
    } finally {
      setSaving(false);
    }
  };

  // ── Delete slot ───────────────────────────────────────────────────────────

  const handleDelete = async (slot: Slot) => {
    if (slot.is_booked) {
      setAlert({ type: 'error', msg: 'Cannot remove a booked slot.' });
      return;
    }
    try {
      await fetch(
        `http://localhost:8000/api/v1/therapists/${selected?.therapist_id}/availability/${slot.availability_id}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setSlots(prev => prev.filter(s => s.availability_id !== slot.availability_id));
      setAlert({ type: 'success', msg: 'Slot removed.' });
    } catch {
      setAlert({ type: 'error', msg: 'Failed to remove slot.' });
    }
  };

  // ── Week grid helpers ─────────────────────────────────────────────────────

  const slotsOnDate = (date: Date) =>
    slots.filter(s => s.date === fmt(date)).sort((a, b) => a.start_time.localeCompare(b.start_time));

  const totalSlots    = slots.length;
  const bookedSlots   = slots.filter(s => s.is_booked).length;
  const availableSlots = totalSlots - bookedSlots;

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {alert && (
        <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 2 }}>
          {alert.msg}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* ── Left: Therapist selector ── */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ px: 2.5, py: 2, bgcolor: '#4d4f44' }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#fff' }}>
                Therapists
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>
                Select to manage availability
              </Typography>
            </Box>
            <Stack divider={<Divider />}>
              {therapists.map(t => (
                <Box
                  key={t.therapist_id}
                  onClick={() => setSelected(t)}
                  sx={{
                    px: 2, py: 1.5, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 1.5,
                    bgcolor: selected?.therapist_id === t.therapist_id ? '#f0f0ec' : '#fff',
                    borderLeft: selected?.therapist_id === t.therapist_id ? '3px solid #4d4f44' : '3px solid transparent',
                    transition: 'all 0.15s',
                    '&:hover': { bgcolor: '#f7f7f5' },
                  }}>
                  <Avatar sx={{ width: 36, height: 36, bgcolor: avatarColor(t.name), fontSize: 13, fontWeight: 700 }}>
                    {initials(t.name)}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" fontWeight={600} noWrap>{t.name}</Typography>
                    <Chip
                      label={t.is_available ? 'Available' : 'Unavailable'}
                      size="small"
                      color={t.is_available ? 'success' : 'default'}
                      sx={{ height: 16, fontSize: '10px', mt: 0.3 }}
                    />
                  </Box>
                </Box>
              ))}
              {therapists.length === 0 && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <PersonIcon sx={{ fontSize: 32, color: 'text.disabled' }} />
                  <Typography variant="body2" color="text.secondary">No therapists found</Typography>
                </Box>
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* ── Right: Calendar + slots ── */}
        <Grid item xs={12} md={9}>
          {!selected ? (
            <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 3 }}>
              <EventAvailableIcon sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
              <Typography color="text.secondary">Select a therapist to manage their availability</Typography>
            </Paper>
          ) : (
            <Stack spacing={2.5}>
              {/* Header */}
              <Paper sx={{ p: 2.5, borderRadius: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar sx={{ bgcolor: avatarColor(selected.name), width: 48, height: 48, fontWeight: 700 }}>
                      {initials(selected.name)}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>{selected.name}</Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                        <Chip icon={<CheckCircleIcon sx={{ fontSize: '14px !important' }} />}
                          label={`${availableSlots} available`} size="small" color="success"
                          sx={{ height: 20, fontSize: '11px' }} />
                        <Chip icon={<BlockIcon sx={{ fontSize: '14px !important' }} />}
                          label={`${bookedSlots} booked`} size="small" color="warning"
                          sx={{ height: 20, fontSize: '11px' }} />
                      </Stack>
                    </Box>
                  </Box>
                  <Stack direction="row" spacing={1}>
                    <ToggleButtonGroup size="small" value={view}
                      exclusive onChange={(_, v) => v && setView(v)}>
                      <ToggleButton value="grid" sx={{ px: 1.5, fontSize: '12px' }}>Week</ToggleButton>
                      <ToggleButton value="list" sx={{ px: 1.5, fontSize: '12px' }}>List</ToggleButton>
                    </ToggleButtonGroup>
                    <Button variant="contained" startIcon={<AddIcon />} onClick={() => setAddOpen(true)}
                      sx={{ bgcolor: '#4d4f44', '&:hover': { bgcolor: '#6a6c60' }, textTransform: 'none', borderRadius: 2 }}>
                      Add Slot
                    </Button>
                  </Stack>
                </Box>
              </Paper>

              {slotsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
              ) : view === 'grid' ? (
                /* ── Week grid view ── */
                <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                  {/* Week nav */}
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    px: 3, py: 2, bgcolor: '#f7f7f5', borderBottom: '1px solid #eee' }}>
                    <IconButton size="small" onClick={() => setWeekOffset(w => w - 1)}>
                      <ArrowBackIosNewIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {fmtDisplay(weekDates[0])} — {fmtDisplay(weekDates[6])}
                    </Typography>
                    <IconButton size="small" onClick={() => setWeekOffset(w => w + 1)}>
                      <ArrowForwardIosIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Grid */}
                  <Grid container sx={{ borderBottom: '1px solid #eee' }}>
                    {weekDates.map((date, di) => {
                      const daySlots = slotsOnDate(date);
                      const isToday = fmt(date) === fmt(new Date());
                      return (
                        <Grid item xs key={di} sx={{
                          borderRight: di < 6 ? '1px solid #eee' : 'none',
                          minHeight: 120,
                        }}>
                          {/* Day header */}
                          <Box sx={{
                            px: 1, py: 1.5, textAlign: 'center',
                            bgcolor: isToday ? '#4d4f44' : '#fafaf8',
                            borderBottom: '1px solid #eee',
                          }}>
                            <Typography variant="caption"
                              sx={{ color: isToday ? 'rgba(255,255,255,0.7)' : 'text.secondary', display: 'block' }}>
                              {DAYS[date.getDay()]}
                            </Typography>
                            <Typography variant="body2" fontWeight={700}
                              sx={{ color: isToday ? '#fff' : 'text.primary' }}>
                              {date.getDate()}
                            </Typography>
                            {daySlots.length > 0 && (
                              <Badge badgeContent={daySlots.length} color="primary"
                                sx={{ mt: 0.5, '& .MuiBadge-badge': { fontSize: '9px', minWidth: 14, height: 14 } }}>
                                <Box sx={{ width: 6 }} />
                              </Badge>
                            )}
                          </Box>

                          {/* Slots */}
                          <Box sx={{ p: 0.5 }}>
                            {daySlots.length === 0 ? (
                              <Typography variant="caption" color="text.disabled"
                                sx={{ display: 'block', textAlign: 'center', mt: 2, fontSize: '10px' }}>
                                No slots
                              </Typography>
                            ) : (
                              daySlots.map(slot => (
                                <Box key={slot.availability_id} sx={{
                                  mb: 0.5, px: 0.8, py: 0.5, borderRadius: 1, fontSize: '11px',
                                  bgcolor: slot.is_booked ? '#fff3e0' : '#e8f5e9',
                                  border: `1px solid ${slot.is_booked ? '#ffcc80' : '#a5d6a7'}`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                }}>
                                  <Typography sx={{ fontSize: '10px', fontWeight: 600,
                                    color: slot.is_booked ? '#e65100' : '#2e7d32' }}>
                                    {slot.start_time}
                                  </Typography>
                                  {!slot.is_booked && (
                                    <IconButton size="small" onClick={() => handleDelete(slot)}
                                      sx={{ p: 0, color: '#bbb', '&:hover': { color: '#e53935' } }}>
                                      <DeleteOutlineIcon sx={{ fontSize: 12 }} />
                                    </IconButton>
                                  )}
                                  {slot.is_booked && (
                                    <CheckCircleIcon sx={{ fontSize: 12, color: '#e65100' }} />
                                  )}
                                </Box>
                              ))
                            )}
                          </Box>
                        </Grid>
                      );
                    })}
                  </Grid>

                  {/* Legend */}
                  <Box sx={{ px: 3, py: 1.5, display: 'flex', gap: 2, bgcolor: '#fafaf8' }}>
                    {[
                      { color: '#e8f5e9', border: '#a5d6a7', label: 'Available' },
                      { color: '#fff3e0', border: '#ffcc80', label: 'Booked' },
                    ].map(l => (
                      <Box key={l.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Box sx={{ width: 12, height: 12, borderRadius: 0.5,
                          bgcolor: l.color, border: `1px solid ${l.border}` }} />
                        <Typography variant="caption" color="text.secondary">{l.label}</Typography>
                      </Box>
                    ))}
                  </Box>
                </Paper>
              ) : (
                /* ── List view ── */
                <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ bgcolor: '#f7f7f5' }}>
                          <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>Date</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>Start</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>End</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '12px' }}>Status</TableCell>
                          <TableCell sx={{ fontWeight: 700, fontSize: '12px' }} align="right">Action</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {slots.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: 'text.disabled' }}>
                              No availability slots found
                            </TableCell>
                          </TableRow>
                        ) : (
                          [...slots]
                            .sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time))
                            .map(slot => (
                              <TableRow key={slot.availability_id}
                                sx={{ '&:hover': { bgcolor: '#fafaf8' } }}>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <CalendarMonthIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                    <Typography variant="body2">
                                      {new Date(slot.date).toLocaleDateString('en-GB',
                                        { weekday: 'short', day: 'numeric', month: 'short' })}
                                    </Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <AccessTimeIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                                    <Typography variant="body2">{slot.start_time}</Typography>
                                  </Box>
                                </TableCell>
                                <TableCell>
                                  <Typography variant="body2">{slot.end_time}</Typography>
                                </TableCell>
                                <TableCell>
                                  <Chip
                                    label={slot.is_booked ? 'Booked' : 'Available'}
                                    size="small"
                                    color={slot.is_booked ? 'warning' : 'success'}
                                    sx={{ height: 20, fontSize: '11px' }}
                                  />
                                </TableCell>
                                <TableCell align="right">
                                  {!slot.is_booked && (
                                    <Tooltip title="Remove slot">
                                      <IconButton size="small" color="error" onClick={() => handleDelete(slot)}>
                                        <DeleteOutlineIcon fontSize="small" />
                                      </IconButton>
                                    </Tooltip>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              )}
            </Stack>
          )}
        </Grid>
      </Grid>

      {/* ── Add Slot Dialog ── */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Add Availability Slot</DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2.5 }}>
          <Stack spacing={2.5}>
            <Box sx={{ p: 1.5, bgcolor: '#f0f0ec', borderRadius: 2,
              display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar sx={{ bgcolor: avatarColor(selected?.name || ''), width: 32, height: 32, fontSize: 12 }}>
                {selected ? initials(selected.name) : '?'}
              </Avatar>
              <Typography variant="body2" fontWeight={600}>{selected?.name}</Typography>
            </Box>

            <TextField label="Date *" type="date" value={addForm.date}
              onChange={e => setAddForm(f => ({ ...f, date: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: new Date().toISOString().split('T')[0] }}
              size="small" fullWidth />

            <Stack direction="row" spacing={2}>
              <FormControl size="small" fullWidth>
                <InputLabel>Start Time *</InputLabel>
                <Select value={addForm.start_time} label="Start Time *"
                  onChange={e => {
                    const start = e.target.value;
                    const endIdx = TIME_SLOTS.indexOf(start) + 1;
                    const end = TIME_SLOTS[endIdx] || '';
                    setAddForm(f => ({ ...f, start_time: start, end_time: end }));
                  }}>
                  {TIME_SLOTS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                </Select>
              </FormControl>

              <FormControl size="small" fullWidth>
                <InputLabel>End Time *</InputLabel>
                <Select value={addForm.end_time} label="End Time *"
                  onChange={e => setAddForm(f => ({ ...f, end_time: e.target.value }))}>
                  {TIME_SLOTS.filter(t => t > addForm.start_time).map(t =>
                    <MenuItem key={t} value={t}>{t}</MenuItem>
                  )}
                </Select>
              </FormControl>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setAddOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleAddSlot}
            disabled={saving || !addForm.date || !addForm.start_time || !addForm.end_time}
            sx={{ textTransform: 'none', bgcolor: '#4d4f44', '&:hover': { bgcolor: '#6a6c60' } }}>
            {saving ? <CircularProgress size={18} color="inherit" /> : 'Add Slot'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TherapistAvailability;