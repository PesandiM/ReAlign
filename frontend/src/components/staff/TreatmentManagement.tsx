import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, IconButton, Tooltip, CircularProgress,
  Alert, Stack, Switch, FormControlLabel, InputAdornment, Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import SearchIcon from '@mui/icons-material/Search';
import AccessibilityNewIcon from '@mui/icons-material/AccessibilityNew';
import SpaIcon from '@mui/icons-material/Spa';
import HealingIcon from '@mui/icons-material/Healing';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import BlurCircularIcon from '@mui/icons-material/BlurCircular';
import LocalFloristIcon from '@mui/icons-material/LocalFlorist';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import { SvgIconProps } from '@mui/material';
import { staffService, Treatment } from '../../services/staffService';

const CATEGORIES = ['CHIRO', 'MASSAGE', 'GUA_SHA', 'STRETCHING', 'CUPPING', 'WELLNESS', 'NUTRITION'];
const TARGETS = ['Adult', 'Pediatric', 'Both'];

const CATEGORY_COLOR: Record<string, string> = {
  CHIRO:      '#e3f0fb',
  MASSAGE:    '#f3e8ff',
  GUA_SHA:    '#fff3e0',
  STRETCHING: '#e8f5e9',
  CUPPING:    '#fce4ec',
  WELLNESS:   '#e0f7fa',
  NUTRITION:  '#f9fbe7',
};

const CATEGORY_ICON_COLOR: Record<string, string> = {
  CHIRO:      '#1565c0',
  MASSAGE:    '#6a1b9a',
  GUA_SHA:    '#bf360c',
  STRETCHING: '#1b5e20',
  CUPPING:    '#b71c1c',
  WELLNESS:   '#006064',
  NUTRITION:  '#33691e',
};

const CategoryIcon: React.FC<{ category: string } & SvgIconProps> = ({ category, ...props }) => {
  switch (category) {
    case 'CHIRO':      return <AccessibilityNewIcon {...props} />;
    case 'MASSAGE':    return <SpaIcon {...props} />;
    case 'GUA_SHA':    return <HealingIcon {...props} />;
    case 'STRETCHING': return <FitnessCenterIcon {...props} />;
    case 'CUPPING':    return <BlurCircularIcon {...props} />;
    case 'WELLNESS':   return <SpaIcon {...props} />;
    case 'NUTRITION':  return <LocalFloristIcon {...props} />;
    default:           return <MedicalServicesIcon {...props} />;
  }
};

const emptyForm = {
  name: '', category: 'CHIRO', subCategory: '', target: 'Adult',
  price: 0, duration: 30, description: '', isActive: true,
};

const TreatmentManagement: React.FC = () => {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('ALL');
  const [showInactive, setShowInactive] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Treatment | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  useEffect(() => { fetchTreatments(); }, [showInactive]);

  const fetchTreatments = async () => {
    try {
      setLoading(true);
      const data = await staffService.getTreatments(showInactive);
      setTreatments(data);
    } catch (e) {
      setAlert({ type: 'error', msg: 'Failed to load treatments.' });
    } finally {
      setLoading(false);
    }
  };

  const openAdd = () => { setEditing(null); setForm({ ...emptyForm }); setDialogOpen(true); };
  const openEdit = (t: Treatment) => {
    setEditing(t);
    setForm({
      name: t.name, category: t.category, subCategory: t.subCategory || '',
      target: t.target || 'Adult', price: t.price, duration: t.duration,
      description: t.description || '', isActive: t.isActive,
    });
    setDialogOpen(true);
  };
  const closeDialog = () => { setDialogOpen(false); setEditing(null); };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await staffService.updateTreatment(editing.treatment_id, form);
        setAlert({ type: 'success', msg: `"${form.name}" updated.` });
      } else {
        await staffService.createTreatment(form);
        setAlert({ type: 'success', msg: `"${form.name}" created.` });
      }
      fetchTreatments();
      closeDialog();
    } catch (e: any) {
      setAlert({ type: 'error', msg: e.message || 'Save failed.' });
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (t: Treatment) => {
    try {
      if (t.isActive) {
        await staffService.deleteTreatment(t.treatment_id);
        setAlert({ type: 'success', msg: `"${t.name}" deactivated.` });
      } else {
        await staffService.activateTreatment(t.treatment_id);
        setAlert({ type: 'success', msg: `"${t.name}" activated.` });
      }
      fetchTreatments();
    } catch (e: any) {
      setAlert({ type: 'error', msg: e.message || 'Action failed.' });
    }
  };

  const filtered = treatments.filter(t => {
    const matchSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.category.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'ALL' || t.category === filterCat;
    return matchSearch && matchCat;
  });

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Treatment Catalogue</Typography>
          <Typography variant="body2" color="text.secondary">
            {treatments.filter(t => t.isActive).length} active · {treatments.length} total
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
          sx={{ bgcolor: '#4d4f44', '&:hover': { bgcolor: '#6a6c60' }, textTransform: 'none', borderRadius: 2 }}>
          Add Treatment
        </Button>
      </Box>

      {alert && (
        <Alert severity={alert.type} onClose={() => setAlert(null)} sx={{ mb: 2 }}>
          {alert.msg}
        </Alert>
      )}

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
        <TextField size="small" placeholder="Search treatments…" value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>
            ),
          }}
          sx={{ width: 240 }} />

        <Stack direction="row" spacing={1} flexWrap="wrap">
          {['ALL', ...CATEGORIES].map(cat => (
            <Button key={cat} size="small"
              variant={filterCat === cat ? 'contained' : 'outlined'}
              startIcon={cat !== 'ALL'
                ? <CategoryIcon category={cat} sx={{ fontSize: '14px !important' }} />
                : undefined}
              onClick={() => setFilterCat(cat)}
              sx={{
                textTransform: 'none', borderRadius: 2, minWidth: 'unset', px: 1.5,
                ...(filterCat === cat
                  ? { bgcolor: '#4d4f44', '&:hover': { bgcolor: '#6a6c60' } }
                  : {}),
              }}>
              {cat === 'ALL' ? 'All' : cat}
            </Button>
          ))}
        </Stack>

        <FormControlLabel
          control={
            <Switch size="small" checked={showInactive}
              onChange={e => setShowInactive(e.target.checked)} />
          }
          label={<Typography variant="body2">Show inactive</Typography>} />
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : filtered.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 5, textAlign: 'center' }}>
          No treatments found
        </Typography>
      ) : (
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                {['Treatment', 'Category', 'Target', 'Duration', 'Price (LKR)', 'Status', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600, py: 1.5 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(t => (
                <TableRow key={t.treatment_id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{t.name}</Typography>
                    {t.subCategory && (
                      <Typography variant="caption" color="text.secondary">{t.subCategory}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={
                        <CategoryIcon
                          category={t.category}
                          sx={{ fontSize: '14px !important', color: `${CATEGORY_ICON_COLOR[t.category]} !important` }}
                        />
                      }
                      label={t.category}
                      size="small"
                      sx={{
                        bgcolor: CATEGORY_COLOR[t.category] || '#f5f5f5',
                        fontWeight: 500,
                        fontSize: '11px',
                        color: CATEGORY_ICON_COLOR[t.category] || 'text.primary',
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{t.target || 'Adult'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{t.duration} min</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {t.price.toLocaleString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={t.isActive ? 'Active' : 'Inactive'} size="small"
                      color={t.isActive ? 'success' : 'default'} />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(t)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title={t.isActive ? 'Deactivate' : 'Activate'}>
                        <IconButton size="small"
                          color={t.isActive ? 'error' : 'success'}
                          onClick={() => handleToggle(t)}>
                          <PowerSettingsNewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          {editing ? `Edit: ${editing.name}` : 'Add New Treatment'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={2}>
            <TextField label="Treatment Name *" value={form.name} size="small" fullWidth
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Stack direction="row" spacing={2}>
              <TextField select label="Category *" value={form.category} size="small" fullWidth
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                {CATEGORIES.map(c => (
                  <MenuItem key={c} value={c}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CategoryIcon category={c} fontSize="small"
                        sx={{ color: CATEGORY_ICON_COLOR[c] }} />
                      {c}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
              <TextField select label="Target" value={form.target} size="small" fullWidth
                onChange={e => setForm(f => ({ ...f, target: e.target.value }))}>
                {TARGETS.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
              </TextField>
            </Stack>
            <TextField label="Sub Category" value={form.subCategory} size="small" fullWidth
              placeholder="e.g., Consultation, Follow-up"
              onChange={e => setForm(f => ({ ...f, subCategory: e.target.value }))} />
            <Stack direction="row" spacing={2}>
              <TextField label="Price (LKR) *" type="number" value={form.price} size="small" fullWidth
                inputProps={{ min: 0, step: 100 }}
                onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} />
              <TextField label="Duration (min) *" type="number" value={form.duration} size="small" fullWidth
                inputProps={{ min: 5, step: 5 }}
                onChange={e => setForm(f => ({ ...f, duration: Number(e.target.value) }))} />
            </Stack>
            <TextField label="Description" value={form.description} size="small" fullWidth multiline rows={3}
              placeholder="Describe the treatment…"
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            <FormControlLabel
              control={
                <Switch checked={form.isActive}
                  onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} />
              }
              label="Active (available for booking)" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeDialog} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name.trim()}
            sx={{ textTransform: 'none', bgcolor: '#4d4f44', '&:hover': { bgcolor: '#6a6c60' } }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default TreatmentManagement;