import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, Card, CardContent, CardActions,
  Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Tooltip, CircularProgress, Alert, Stack,
  Switch, FormControlLabel, Divider, Avatar, InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import { staffService, Therapist } from '../../services/staffService';

const emptyForm = { name: '', bio: '', is_available: true };

const TherapistManagement: React.FC = () => {
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Therapist | null>(null);
  const [selected, setSelected] = useState<Therapist | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => { fetchTherapists(); }, [showInactive]);

  const fetchTherapists = async () => {
    try {
      setLoading(true);
      const data = await staffService.getTherapists(showInactive);
      setTherapists(data);
    } catch (e) {
      setAlert({ type: 'error', msg: 'Failed to load therapists.' });
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (t: Therapist) => {
    setEditing(t);
    setForm({ name: t.name, bio: t.bio || '', is_available: t.is_available });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await staffService.updateTherapist(editing.therapist_id, form);
        setAlert({ type: 'success', msg: `${form.name} updated.` });
      } else {
        await staffService.createTherapist(form);
        setAlert({ type: 'success', msg: `${form.name} added.` });
      }
      fetchTherapists();
      closeDialog();
    } catch (e: any) {
      setAlert({ type: 'error', msg: e.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selected) return;
    try {
      await staffService.deleteTherapist(selected.therapist_id);
      setAlert({ type: 'success', msg: `${selected.name} deactivated.` });
      fetchTherapists();
    } catch (e: any) {
      setAlert({ type: 'error', msg: e.message || 'Delete failed.' });
    } finally {
      setDeleteDialogOpen(false);
      setSelected(null);
    }
  };

  const initials = (name: string) =>
    name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);

  const avatarColor = (name: string) => {
    const colors = ['#4d4f44', '#6a8d73', '#b5835a', '#5b7fa6', '#8d6a9f'];
    return colors[name.charCodeAt(0) % colors.length];
  };

  const filtered = therapists.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.bio || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Therapist Management</Typography>
          <Typography variant="body2" color="text.secondary">
            {therapists.filter(t => t.is_available).length} available · {therapists.length} total
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
          sx={{ bgcolor: '#4d4f44', '&:hover': { bgcolor: '#6a6c60' }, textTransform: 'none', borderRadius: 2 }}>
          Add Therapist
        </Button>
      </Box>

      {alert && (
        <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 2 }}>
          {alert.msg}
        </Alert>
      )}

      {/* Search & filter row */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 3, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search therapists…" value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ width: 260 }} />
        <FormControlLabel
          control={<Switch size="small" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} />}
          label={<Typography variant="body2">Show unavailable</Typography>} />
      </Box>

      {/* Cards */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <PersonIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
          <Typography color="text.secondary">
            {search ? 'No therapists match your search' : 'No therapists found. Add one to get started.'}
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {filtered.map(therapist => (
            <Grid item xs={12} sm={6} md={4} key={therapist.therapist_id}>
              <Card variant="outlined" sx={{
                borderRadius: 2,
                borderColor: therapist.is_available ? '#e0e0e0' : '#f0f0f0',
                opacity: therapist.is_available ? 1 : 0.65,
                transition: 'box-shadow 0.2s',
                '&:hover': { boxShadow: 3 },
              }}>
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                    <Avatar sx={{ bgcolor: avatarColor(therapist.name), width: 44, height: 44, fontWeight: 700 }}>
                      {initials(therapist.name)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography fontWeight={700} noWrap>{therapist.name}</Typography>
                      <Chip
                        label={therapist.is_available ? 'Available' : 'Unavailable'}
                        size="small"
                        color={therapist.is_available ? 'success' : 'default'}
                        sx={{ height: 20, fontSize: '11px' }}
                      />
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary"
                    sx={{ minHeight: 40, display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {therapist.bio || 'No bio provided.'}
                  </Typography>
                  {therapist.createdAt && (
                    <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                      Added {new Date(therapist.createdAt).toLocaleDateString()}
                    </Typography>
                  )}
                </CardContent>
                <Divider />
                <CardActions sx={{ px: 1.5, py: 1, justifyContent: 'flex-end', gap: 0.5 }}>
                  <Tooltip title="Manage Availability">
                    <IconButton size="small" sx={{ color: '#5b7fa6' }}
                      onClick={() => window.location.href = `/staff/availability?therapist=${therapist.therapist_id}`}>
                      <EventAvailableIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit">
                    <IconButton size="small" onClick={() => openEdit(therapist)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Deactivate">
                    <IconButton size="small" color="error"
                      onClick={() => { setSelected(therapist); setDeleteDialogOpen(true); }}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          {editing ? `Edit: ${editing.name}` : 'Add New Therapist'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField label="Full Name *" value={form.name} size="small" fullWidth
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <TextField label="Bio" value={form.bio} size="small" fullWidth multiline rows={3}
              placeholder="Brief professional background…"
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))} />
            <FormControlLabel
              control={<Switch checked={form.is_available}
                onChange={e => setForm(f => ({ ...f, is_available: e.target.checked }))} />}
              label="Available for appointments" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name.trim()}
            sx={{ textTransform: 'none', bgcolor: '#4d4f44', '&:hover': { bgcolor: '#6a6c60' } }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : editing ? 'Update' : 'Add Therapist'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)} maxWidth="xs">
        <DialogTitle fontWeight={700}>Deactivate Therapist</DialogTitle>
        <DialogContent>
          <Typography>
            Deactivate <strong>{selected?.name}</strong>? They won't appear for new bookings.
            You can reactivate them later.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete}
            sx={{ textTransform: 'none' }}>
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TherapistManagement;