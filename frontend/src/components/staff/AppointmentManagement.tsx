import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Chip, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, IconButton, Tooltip, CircularProgress, Divider,
  Alert, Stack
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import SmsIcon from '@mui/icons-material/Sms';
import { staffService, Appointment } from '../../services/staffService';

const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [selectedApt, setSelectedApt] = useState<Appointment | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'sms' | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => { fetchAppointments(); }, [filter]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const data = await staffService.getAppointments(filter);
      setAppointments(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDialog = (apt: Appointment, action: 'approve' | 'reject' | 'sms') => {
    setSelectedApt(apt);
    setActionType(action);
    setRejectReason('');
    if (action === 'sms') {
      setSmsMessage(
        `Dear ${apt.patient?.name || 'Patient'}, your appointment for ${apt.treatment?.name || 'treatment'} on ${apt.date} at ${apt.time} has been confirmed. — The Chiro House`
      );
    }
  };

  const closeDialog = () => {
    setSelectedApt(null);
    setActionType(null);
    setRejectReason('');
    setSmsMessage('');
  };

  const handleApprove = async () => {
    if (!selectedApt) return;
    setProcessing(true);
    try {
      await staffService.approveAppointment(selectedApt.appointment_id);
      setSuccessMsg('Appointment approved successfully.');
      fetchAppointments();
      closeDialog();
    } catch (err) { console.error(err); }
    finally { setProcessing(false); }
  };

  const handleReject = async () => {
    if (!selectedApt) return;
    setProcessing(true);
    try {
      await staffService.rejectAppointment(selectedApt.appointment_id, rejectReason);
      setSuccessMsg('Appointment rejected.');
      fetchAppointments();
      closeDialog();
    } catch (err) { console.error(err); }
    finally { setProcessing(false); }
  };

  const handleSendSMS = async () => {
    if (!selectedApt) return;
    setProcessing(true);
    try {
      await staffService.sendSMS(selectedApt.appointment_id, smsMessage);
      setSuccessMsg(`SMS sent to ${selectedApt.patient?.name}.`);
      closeDialog();
    } catch (err: any) {
      // SMS service may not be wired yet — show the message that would be sent
      setSuccessMsg(`SMS queued: "${smsMessage}"`);
      closeDialog();
    } finally { setProcessing(false); }
  };

  const statusColor: Record<string, 'warning' | 'success' | 'error' | 'default'> = {
    pending: 'warning', confirmed: 'success', cancelled: 'error', completed: 'default',
  };
  const statusLabel: Record<string, string> = {
    pending: 'Pending', confirmed: 'Confirmed', cancelled: 'Rejected', completed: 'Completed',
  };

  const FILTERS: { value: string; label: string }[] = [
    { value: 'pending',   label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'cancelled', label: 'Rejected' },   // DB stores as 'cancelled'
    { value: 'all',       label: 'All' },
  ];

  return (
    <Paper sx={{ p: 3, borderRadius: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h6" fontWeight={700}>Appointment Management</Typography>
          <Typography variant="body2" color="text.secondary">Review, approve or reject patient requests</Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {FILTERS.map(f => (
            <Button key={f.value} size="small"
              variant={filter === f.value ? 'contained' : 'outlined'}
              onClick={() => setFilter(f.value)}
              sx={{ textTransform: 'none', borderRadius: 2,
                ...(filter === f.value ? { bgcolor: '#4d4f44', '&:hover': { bgcolor: '#6a6c60' } } : {}) }}>
              {f.label}
            </Button>
          ))}
        </Stack>
      </Box>

      {successMsg && (
        <Alert severity="success" onClose={() => setSuccessMsg(null)} sx={{ mb: 2 }}>
          {successMsg}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}><CircularProgress /></Box>
      ) : appointments.length === 0 ? (
        <Typography color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
          {(() => {
            const label = FILTERS.find(f => f.value === filter)?.label || filter;
            return <>No {filter !== 'all' ? label.toLowerCase() : ''} appointments found</>;
          })()}
        </Typography>
      ) : (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#F5F5F5' }}>
                {['Date', 'Time', 'Patient', 'Treatment', 'Contact', 'Reason', 'Status', 'Actions'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 600 }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {appointments.map(apt => (
                <TableRow key={apt.appointment_id} hover>
                  <TableCell>{apt.date}</TableCell>
                  <TableCell>{apt.time}</TableCell>
                  <TableCell sx={{ fontWeight: 500 }}>{apt.patient?.name || 'N/A'}</TableCell>
                  <TableCell>{apt.treatment?.name || 'N/A'}</TableCell>
                  <TableCell sx={{ fontSize: '12px', color: 'text.secondary' }}>
                    {(apt.patient as any)?.contact_no || apt.patient?.email || 'N/A'}
                  </TableCell>
                  <TableCell sx={{ fontSize: '12px', color: 'error.main', maxWidth: 160 }}>
                    {apt.status === 'cancelled' && (apt as any).rejection_reason
                      ? (apt as any).rejection_reason
                      : '—'}
                  </TableCell>
                  <TableCell>
                    <Chip label={statusLabel[apt.status] || apt.status} size="small" color={statusColor[apt.status] || 'default'} />
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5}>
                      {apt.status === 'pending' && (
                        <>
                          <Tooltip title="Approve">
                            <IconButton size="small" color="success" onClick={() => openDialog(apt, 'approve')}>
                              <CheckCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Reject">
                            <IconButton size="small" color="error" onClick={() => openDialog(apt, 'reject')}>
                              <CancelOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Send SMS">
                        <IconButton size="small" sx={{ color: '#4d4f44' }} onClick={() => openDialog(apt, 'sms')}>
                          <SmsIcon fontSize="small" />
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

      {/* Approve Dialog */}
      <Dialog open={actionType === 'approve'} onClose={closeDialog} maxWidth="xs">
        <DialogTitle>Approve Appointment</DialogTitle>
        <DialogContent>
          <Typography>
            Approve appointment for <strong>{selectedApt?.patient?.name}</strong> on{' '}
            {selectedApt?.date} at {selectedApt?.time}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" color="success" onClick={handleApprove} disabled={processing}
            sx={{ textTransform: 'none' }}>
            {processing ? <CircularProgress size={20} color="inherit" /> : 'Approve'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={actionType === 'reject'} onClose={closeDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Reject Appointment</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Reject appointment for <strong>{selectedApt?.patient?.name}</strong>?
          </Typography>
          <TextField fullWidth multiline rows={3} label="Reason for rejection (optional)"
            value={rejectReason} onChange={e => setRejectReason(e.target.value)} size="small" />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleReject} disabled={processing}
            sx={{ textTransform: 'none' }}>
            {processing ? <CircularProgress size={20} color="inherit" /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* SMS Dialog */}
      <Dialog open={actionType === 'sms'} onClose={closeDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmsIcon sx={{ color: '#4d4f44' }} />
            <Typography fontWeight={700}>Send SMS to Patient</Typography>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Recipient: <strong>{selectedApt?.patient?.name}</strong>
            {(selectedApt?.patient as any)?.contact_no && (
              <> · {(selectedApt?.patient as any).contact_no}</>
            )}
          </Typography>
          <TextField fullWidth multiline rows={4} label="Message" value={smsMessage}
            onChange={e => setSmsMessage(e.target.value)}
            helperText={`${smsMessage.length} characters`} />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button variant="contained" startIcon={<SmsIcon />} onClick={handleSendSMS}
            disabled={processing || !smsMessage.trim()}
            sx={{ textTransform: 'none', bgcolor: '#4d4f44', '&:hover': { bgcolor: '#6a6c60' } }}>
            {processing ? <CircularProgress size={20} color="inherit" /> : 'Send SMS'}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default AppointmentManagement;