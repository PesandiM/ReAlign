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
  IconButton,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
  MenuItem,
  Grid
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import Header from '../components/common/Header';
import { authService, PatientRegisterData } from '../services/authService';

const steps = ['Account Details', 'Personal Information'];

const SignUp: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    // Account Details
    email: '',
    password: '',
    confirmPassword: '',
    
    // Personal Info
    name: '',
    phone: '',
    age: '',
    gender: '',
  });

  // Handle TextField changes
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handle Select changes
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleNext = () => {
    if (activeStep === 0) {
      // Validate account details
      if (!formData.email || !formData.password || !formData.confirmPassword) {
        setError('Please fill in all required fields');
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }
    
    setError(null);
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    setError(null);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const patientData: PatientRegisterData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        age: parseInt(formData.age),
        gender: formData.gender,
      };

      await authService.register(patientData);
      
      // Auto login after successful registration
      await authService.login({
        email: formData.email,
        password: formData.password,
      });
      
      navigate('/patient');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <TextField
              fullWidth
              name="email"
              label="Email Address *"
              type="email"
              value={formData.email}
              onChange={handleTextChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              name="password"
              label="Password *"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleTextChange}
              margin="normal"
              required
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
            <TextField
              fullWidth
              name="confirmPassword"
              label="Confirm Password *"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleTextChange}
              margin="normal"
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <TextField
              fullWidth
              name="name"
              label="Full Name *"
              value={formData.name}
              onChange={handleTextChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              name="phone"
              label="Phone Number *"
              value={formData.phone}
              onChange={handleTextChange}
              margin="normal"
              required
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  name="age"
                  label="Age *"
                  type="number"
                  value={formData.age}
                  onChange={handleTextChange}
                  margin="normal"
                  required
                  inputProps={{ min: 0, max: 120 }}
                />
              </Grid>
              <Grid item xs={6}>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Gender</InputLabel>
                  <Select
                    name="gender"
                    value={formData.gender}
                    label="Gender"
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="female">Female</MenuItem>
                    <MenuItem value="male">Male</MenuItem>
                    <MenuItem value="non-binary">Non-Binary</MenuItem>
                    <MenuItem value="prefer-not">Prefer not to say</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        );
      
      default:
        return 'Unknown step';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#e5e2d6' }}>
      <Header onLoginClick={() => setLoginOpen(true)} />
      
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom color="primary">
            Create Patient Account
          </Typography>
          <Typography variant="body1" align="center" color="textSecondary" paragraph>
            Join ReAlign for personalized care
          </Typography>

          <Stepper activeStep={activeStep} sx={{ my: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {getStepContent(activeStep)}

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0 || loading}
            >
              Back
            </Button>
            
            <Button
              variant="contained"
              onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
              disabled={loading}
            >
              {loading ? (
                <CircularProgress size={24} />
              ) : activeStep === steps.length - 1 ? (
                'Create Account'
              ) : (
                'Next'
              )}
            </Button>
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="textSecondary">
              Already have an account?{' '}
              <Link component={RouterLink} to="/login" variant="body2">
                Sign in here
              </Link>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default SignUp;