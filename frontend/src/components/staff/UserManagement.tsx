import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
  IconButton, Tooltip, Divider, Alert, CircularProgress, Grid
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { staffService, User } from '../../services/staffService';
import { authService } from '../../services/authService';

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: string;
  phone: string;
  age: string;
  gender: string;
  // Therapist-specific
  bio: string;
  specializations: string;
  is_available: boolean;
}

const emptyForm: UserFormData = {
  name: '', email: '', password: '', role: 'patient',
  phone: '', age: '', gender: 'female',
  bio: '', specializations: '', is_available: true,
};

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<UserFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const currentUserRole = authService.getUserRole();

  useEffect(() => { fetchUsers(); }, [roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await staffService.getUsers(roleFilter || null);
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setEditingUser(null);
    setFormData(emptyForm);
    setError(null);
    setDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name || '',
      email: user.email || '',
      password: '',
      role: user.role || 'patient',
      phone: (user as any).phone || '',
      age: (user as any).age?.toString() || '',
      gender: (user as any).gender || 'female',
      bio: (user as any).bio || '',
      specializations: ((user as any).specializations || []).join(', '),
      is_available: (user as any).is_available ?? true,
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.email) {
      setError('Name and email are required.');
      return;
    }
    if (!editingUser && !formData.password) {
      setError('Password is required for new users.');
      return;
    }
    try {
      setSaving(true);
      setError(null);

      const payload: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender,
      };
      if (formData.password) payload.password = formData.password;

      // If therapist, include therapist-specific fields
      if (formData.role === 'therapist') {
        payload.bio = formData.bio;
        payload.specializations = formData.specializations.split(',').map(s => s.trim()).filter(Boolean);
        payload.is_available = formData.is_available;
      }

      if (editingUser) {
        await staffService.updateUser(editingUser.userId, payload);
      } else {
        // Use admin create-user endpoint
        await authService.adminCreateUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          ...payload,
        });
      }

      await fetchUsers();
      setDialogOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (userId: string) => {
    try {
      await staffService.deleteUser(userId);
      setDeleteConfirmId(null);
      fetchUsers();
    } catch (err) {
      console.error(err);
    }
  };

  const roleColor: Record<string, 'default' | 'info' | 'success' | 'warning' | 'error'> = {
    patient: 'info', staff: 'default', therapist: 'success', admin: 'warning',
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>User Management</Typography>
          <Typography variant="body2" color="text.secondary">
            {currentUserRole === 'admin' ? '' : 'View patients and staff'}
          </Typography>
        </Box>
        {currentUserRole === 'admin' && (
          <Button variant="contained" startIcon={<PersonAddIcon />} onClick={openAddDialog}
            sx={{ borderRadius: 2, textTransform: 'none', bgcolor: '#4d4f44', '&:hover': { bgcolor: '#6a6c60' } }}>
            Add User
          </Button>
        )}
      </Box>

      {/* Filter */}
      <Box sx={{ mb: 3 }}>
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Filter by Role</InputLabel>
          <Select value={roleFilter} label="Filter by Role" onChange={(e) => setRoleFilter(e.target.value)}>
            <MenuItem value="">All Users</MenuItem>
            <MenuItem value="patient">Patients</MenuItem>
            <MenuItem value="therapist">Therapists</MenuItem>
            <MenuItem value="staff">Staff</MenuItem>
            <MenuItem value="admin">Admins</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Age / Gender</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Last Login</TableCell>
                {currentUserRole === 'admin' && <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No users found
                  </TableCell>
                </TableRow>
              ) : users.map(user => (
                <TableRow key={user.userId} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip label={user.role} size="small" color={roleColor[user.role] || 'default'} />
                  </TableCell>
                  <TableCell>{(user as any).phone || 'N/A'}</TableCell>
                  <TableCell>
                    {(user as any).age ? `${(user as any).age} yrs` : '—'}
                    {(user as any).gender ? ` / ${(user as any).gender}` : ''}
                  </TableCell>
                  <TableCell>
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                  </TableCell>
                  {currentUserRole === 'admin' && (
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEditDialog(user)} sx={{ color: '#4d4f44' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => setDeleteConfirmId(user.userId)} sx={{ color: '#d32f2f' }}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon sx={{ color: '#4d4f44' }} />
            <Typography fontWeight={700}>{editingUser ? 'Edit User' : 'Add New User'}</Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Full Name *" value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Email *" type="email" value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label={editingUser ? 'New Password (leave blank to keep)' : 'Password *'}
                type="password" value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={12} sm={6}>
              {/* Role — this is the key admin-only field */}
              <FormControl fullWidth size="small">
                <InputLabel>Role *</InputLabel>
                <Select value={formData.role} label="Role *"
                  onChange={e => setFormData({ ...formData, role: e.target.value })}>
                  <MenuItem value="patient">Patient</MenuItem>
                  <MenuItem value="staff">Staff</MenuItem>
                  <MenuItem value="therapist">Therapist</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField fullWidth label="Age" type="number" value={formData.age}
                onChange={e => setFormData({ ...formData, age: e.target.value })} size="small" />
            </Grid>
            <Grid item xs={6} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Gender</InputLabel>
                <Select value={formData.gender} label="Gender"
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}>
                  <MenuItem value="female">Female</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            {/* Therapist-specific fields — shown only when role = therapist */}
            {formData.role === 'therapist' && (
              <>
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }}>
                    <Chip label="Therapist Details" size="small" color="success" />
                  </Divider>
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Bio" multiline rows={3} value={formData.bio}
                    onChange={e => setFormData({ ...formData, bio: e.target.value })} size="small"
                    placeholder="Brief professional bio..." />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth label="Specializations (comma-separated)" value={formData.specializations}
                    onChange={e => setFormData({ ...formData, specializations: e.target.value })} size="small"
                    placeholder="e.g. Chiropractic, Sports Massage, Gua Sha" />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Availability Status</InputLabel>
                    <Select value={formData.is_available ? 'true' : 'false'} label="Availability Status"
                      onChange={e => setFormData({ ...formData, is_available: e.target.value === 'true' })}>
                      <MenuItem value="true">Available for Appointments</MenuItem>
                      <MenuItem value="false">Unavailable</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDialogOpen(false)} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}
            sx={{ textTransform: 'none', bgcolor: '#4d4f44', '&:hover': { bgcolor: '#6a6c60' } }}>
            {saving ? <CircularProgress size={20} color="inherit" /> : (editingUser ? 'Update User' : 'Create User')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteConfirmId} onClose={() => setDeleteConfirmId(null)} maxWidth="xs">
        <DialogTitle>Delete User</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this user? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
            sx={{ textTransform: 'none' }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default UserManagement;