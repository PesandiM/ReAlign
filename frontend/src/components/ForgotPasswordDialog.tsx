import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, TextField, Typography, Stack, Alert,
  CircularProgress, Box, Divider, InputAdornment, IconButton
} from '@mui/material';
import LockResetIcon from '@mui/icons-material/LockReset';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const API_BASE = 'http://localhost:8000/api/auth';

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = 'email' | 'otp' | 'done';

const ForgotPasswordDialog: React.FC<Props> = ({ open, onClose }) => {
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const reset = () => {
    setStep('email');
    setEmail('');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setError(null);
    setShowPassword(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(reset, 300);
  };

  // ── Step 1: Send OTP ──────────────────────────────────────────────────────

  const handleSendOTP = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Failed to send OTP.');
      setStep('otp');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      await fetch(`${API_BASE}/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {
      setError('Failed to resend. Try again.');
    } finally {
      setResending(false);
    }
  };

  // ── Step 2: Verify OTP + set new password ─────────────────────────────────

  const handleReset = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || 'Reset failed.');
      setStep('done');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#e8f5e9',
            display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LockResetIcon sx={{ color: '#4d7c4f', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography fontWeight={700} lineHeight={1.2}>
              {step === 'done' ? 'Password Reset!' : 'Forgot Password'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {step === 'email' && 'Enter your email to receive a reset code'}
              {step === 'otp' && `Code sent to ${email}`}
              {step === 'done' && 'Your password has been updated'}
            </Typography>
          </Box>
        </Box>

        {/* Step dots */}
        {step !== 'done' && (
          <Stack direction="row" spacing={0.5} sx={{ mt: 2 }}>
            {(['email', 'otp'] as Step[]).map((s, i) => (
              <Box key={s} sx={{
                height: 3, flex: 1, borderRadius: 2,
                bgcolor: i <= (['email', 'otp'].indexOf(step)) ? '#4d7c4f' : '#e0e0e0',
                transition: 'background-color 0.3s',
              }} />
            ))}
          </Stack>
        )}
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Step 1 — Email */}
        {step === 'email' && (
          <Stack spacing={2}>
            <TextField
              label="Email address"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
              size="small"
              fullWidth
              autoFocus
              placeholder="your@email.com"
            />
          </Stack>
        )}

        {/* Step 2 — OTP + new password */}
        {step === 'otp' && (
          <Stack spacing={2}>
            <Box sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: 2, display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <MarkEmailReadIcon sx={{ color: '#4d7c4f', flexShrink: 0 }} />
              <Typography variant="body2" color="text.secondary">
                A 6-digit code was sent to <strong>{email}</strong>. Check your inbox (and spam folder).
              </Typography>
            </Box>

            <TextField
              label="6-digit OTP code"
              value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              size="small"
              fullWidth
              autoFocus
              inputProps={{ inputMode: 'numeric', maxLength: 6, style: { letterSpacing: '0.3em', fontSize: '20px', textAlign: 'center' } }}
            />

            <TextField
              label="New password"
              type={showPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              size="small"
              fullWidth
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword(p => !p)}>
                      {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Confirm new password"
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleReset()}
              size="small"
              fullWidth
              error={!!confirmPassword && newPassword !== confirmPassword}
              helperText={confirmPassword && newPassword !== confirmPassword ? "Passwords don't match" : ''}
            />

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button size="small" disabled={resending} onClick={handleResend}
                sx={{ textTransform: 'none', color: 'text.secondary', fontSize: '12px' }}>
                {resending ? 'Resending…' : "Didn't receive the code? Resend"}
              </Button>
            </Box>
          </Stack>
        )}

        {/* Done */}
        {step === 'done' && (
          <Box sx={{ textAlign: 'center', py: 2 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#e8f5e9',
              display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
              <LockResetIcon sx={{ fontSize: 32, color: '#4d7c4f' }} />
            </Box>
            <Typography fontWeight={700} gutterBottom>All done!</Typography>
            <Typography variant="body2" color="text.secondary">
              Your password has been reset successfully.<br />You can now sign in with your new password.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        {step === 'done' ? (
          <Button variant="contained" fullWidth onClick={handleClose}
            sx={{ textTransform: 'none', bgcolor: '#4d4f44', '&:hover': { bgcolor: '#6a6c60' } }}>
            Back to Sign In
          </Button>
        ) : (
          <>
            <Button onClick={handleClose} sx={{ textTransform: 'none' }}>Cancel</Button>
            <Box sx={{ flex: 1 }} />
            {step === 'email' && (
              <Button variant="contained" onClick={handleSendOTP}
                disabled={loading || !email.trim()}
                sx={{ textTransform: 'none', bgcolor: '#4d4f44', '&:hover': { bgcolor: '#6a6c60' } }}>
                {loading ? <CircularProgress size={18} color="inherit" /> : 'Send Code'}
              </Button>
            )}
            {step === 'otp' && (
              <Button variant="contained" onClick={handleReset}
                disabled={loading || otp.length !== 6 || !newPassword || newPassword !== confirmPassword}
                sx={{ textTransform: 'none', bgcolor: '#4d4f44', '&:hover': { bgcolor: '#6a6c60' } }}>
                {loading ? <CircularProgress size={18} color="inherit" /> : 'Reset Password'}
              </Button>
            )}
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ForgotPasswordDialog;