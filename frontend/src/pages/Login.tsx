import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Link,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Header from '../components/common/Header';
import { authService } from '../services/authService';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await authService.login({ email, password });
      
      // Redirect based on role
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
    <Box sx={{ minHeight: '100vh', bgcolor: '#e5e2d6' }}>
      <Header onLoginClick={() => setLoginOpen(true)} />
      
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom color="primary">
            Welcome Back
          </Typography>
          <Typography variant="body1" align="center" color="textSecondary" paragraph>
            Sign in to your account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              margin="normal"
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
              autoComplete="current-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box sx={{ mt: 3 }}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ py: 1.5 }}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>
            </Box>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="textSecondary">
                Don't have an account?{' '}
                <Link component={RouterLink} to="/signup" variant="body2">
                  Sign up here
                </Link>
              </Typography>
            </Box>
          </form>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;