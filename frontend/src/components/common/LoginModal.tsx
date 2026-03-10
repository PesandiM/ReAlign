import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Link
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { authService } from '../../services/authService';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ open, onClose, onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await authService.login({ email, password });
      onClose();
      if (onLoginSuccess) onLoginSuccess();
    
      if (result.role === 'patient') {
        navigate('/patient');
      } else if (result.role === 'staff' || result.role === 'admin') {
        navigate('/staff');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>
        <Typography variant="h5" align="center" color="primary">
          Welcome Back
        </Typography>
        <Typography variant="body2" align="center" color="textSecondary">
          Sign in to book your appointment
        </Typography>
      </DialogTitle>
      
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            margin="normal"
            size="small"
            autoComplete="email"
          />

          <TextField
            fullWidth
            label="Password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            margin="normal"
            size="small"
            autoComplete="current-password"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, flexDirection: 'column', gap: 2 }}>
        <Button
          type="submit"
          fullWidth
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{ py: 1 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Sign In'}
        </Button>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <Link 
            component={RouterLink} 
            to="/forgot-password" 
            variant="body2" 
            onClick={onClose}
          >
            Forgot password?
          </Link>
          <Link 
            component={RouterLink} 
            to="/signup" 
            variant="body2" 
            onClick={onClose}
          >
            Sign up
          </Link>
        </Box>

      </DialogActions>
    </Dialog>
  );
};

export default LoginModal;