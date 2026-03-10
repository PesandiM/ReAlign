import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Grid,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Avatar,
  Chip,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  TextField,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SpaIcon from '@mui/icons-material/Spa';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import PersonIcon from '@mui/icons-material/Person';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import LoginModal from '../components/common/LoginModal';
import { staffApi, appointmentApi } from '../services/api';
import { Staff, TimeSlot, AppointmentRequest } from '../types';
import { useNavigate, useLocation } from 'react-router-dom';

// Fixed styled component - removed 'selected' from props
const TherapistCard = styled(Card)(({ theme }) => ({
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[8],
  },
}));

// Fixed styled component - using props.theme properly
const TimeSlotButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'selected'
})<{ selected?: boolean }>(({ theme, selected }) => ({
  borderRadius: '20px',
  padding: '8px 16px',
  backgroundColor: selected ? theme.palette.primary.main : 'white',
  color: selected ? 'white' : theme.palette.text.primary,
  border: `1px solid ${selected ? theme.palette.primary.main : theme.palette.grey[300]}`,
  '&:hover': {
    backgroundColor: selected ? theme.palette.primary.dark : theme.palette.grey[100],
  },
}));

const steps = ['Select Treatment', 'Choose Staff & Time', 'Confirm Details'];

const AppointmentBooking: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [selectedTreatment, setSelectedTreatment] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get data from prediction results
  const predictedTreatment = location.state?.treatment || 'CHIRO';
  const symptoms = location.state?.symptoms || '';

  // Set initial treatment based on prediction
  useEffect(() => {
    if (predictedTreatment) {
      setSelectedTreatment(predictedTreatment);
    }
  }, [predictedTreatment]);

  // Generate next 7 days for date selection
  const getDates = () => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  // Fetch available staff when treatment or date changes
  useEffect(() => {
    if (selectedTreatment && selectedDate) {
      fetchAvailableStaff();
    }
  }, [selectedTreatment, selectedDate]);

  const fetchAvailableStaff = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await staffApi.getAvailable(selectedDate, selectedTreatment);
      setAvailableStaff(response.data);
      setSelectedStaff(null);
      setAvailableSlots([]);
    } catch (err) {
      setError('Failed to load available staff. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStaffSelect = (staff: Staff) => {
    setSelectedStaff(staff);
    // Find available slots for the selected date
    const availability = staff.availability?.find(a => a.date === selectedDate);
    setAvailableSlots(availability?.slots.filter(slot => !slot.isBooked) || []);
    setSelectedTimeSlot(null);
  };

  const handleNext = async () => {
    if (activeStep === steps.length - 1) {
      // Submit booking
      await submitAppointment();
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const submitAppointment = async () => {
    if (!selectedStaff || !selectedDate || !selectedTimeSlot) return;

    setSubmitting(true);
    setError(null);

    // Get patient from localStorage (you'll implement auth later)
    const patientStr = localStorage.getItem('patient');
    if (!patientStr) {
      setLoginOpen(true);
      setSubmitting(false);
      return;
    }

    const patient = JSON.parse(patientStr);

    const appointmentData: AppointmentRequest = {
      patientId: patient._id,
      patientName: patient.name,
      staffId: selectedStaff._id,
      treatment: selectedTreatment,
      date: selectedDate,
      startTime: selectedTimeSlot.startTime,
      endTime: selectedTimeSlot.endTime,
      symptoms: symptoms,
      notes: notes
    };

    try {
      await appointmentApi.create(appointmentData);
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } catch (err) {
      setError('Failed to book appointment. Please try again.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getTreatmentIcon = (treatment: string) => {
    switch(treatment) {
      case 'CHIRO':
        return <SpaIcon />;
      case 'PHYSIO':
        return <FitnessCenterIcon />;
      case 'MASSAGE':
        return <SelfImprovementIcon />;
      default:
        return <SpaIcon />;
    }
  };

  const getTreatmentName = (treatment: string) => {
    switch(treatment) {
      case 'CHIRO':
        return 'Chiropractic';
      case 'PHYSIO':
        return 'Physiotherapy';
      case 'MASSAGE':
        return 'Massage';
      default:
        return treatment;
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <Box sx={{ backgroundColor: '#e5e2d6', minHeight: '100vh' }}>
      <Header onLoginClick={() => setLoginOpen(true)} />
      
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Breadcrumb */}
        <Typography 
          variant="body2" 
          color="textSecondary" 
          sx={{ mb: 2, cursor: 'pointer' }}
          onClick={() => navigate('/symptom-check')}
        >
          ← Back to Symptom Checker
        </Typography>

        {/* Header */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h4" gutterBottom color="primary">
            Book Your Appointment
          </Typography>
          <Typography variant="body1" color="textSecondary">
            Complete the steps below to schedule your treatment session
          </Typography>
        </Paper>

        {/* Stepper */}
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* Error/Success Messages */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 3 }}>
            ✅ Appointment booked successfully! Redirecting to dashboard...
          </Alert>
        )}

        {/* Main Content */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 3 }}>
              {/* Step 1: Select Treatment */}
              {activeStep === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Select Treatment Type
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Based on your symptoms, here are our recommendations
                  </Typography>

                  <Grid container spacing={2}>
                    {/* Primary Recommendation */}
                    <Grid item xs={12}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          borderColor: selectedTreatment === 'CHIRO' ? 'primary.main' : 'grey.300',
                          borderWidth: selectedTreatment === 'CHIRO' ? 2 : 1,
                          bgcolor: selectedTreatment === 'CHIRO' ? 'rgba(46, 125, 50, 0.05)' : 'white',
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'rgba(46, 125, 50, 0.1)' }
                        }}
                        onClick={() => setSelectedTreatment('CHIRO')}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                              <SpaIcon />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="h6">Chiropractic</Typography>
                                <Chip label="Best Match" color="primary" size="small" />
                              </Box>
                              <Typography variant="body2" color="textSecondary">
                                Spinal adjustment and alignment for back pain relief
                              </Typography>
                            </Box>
                            <Radio checked={selectedTreatment === 'CHIRO'} />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    {/* Alternative Options */}
                    <Grid item xs={6}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          borderColor: selectedTreatment === 'PHYSIO' ? 'secondary.main' : 'grey.300',
                          borderWidth: selectedTreatment === 'PHYSIO' ? 2 : 1,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                        }}
                        onClick={() => setSelectedTreatment('PHYSIO')}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'secondary.light' }}>
                              <FitnessCenterIcon />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1">Physiotherapy</Typography>
                              <Typography variant="caption" color="textSecondary">
                                62% Match
                              </Typography>
                            </Box>
                            <Radio checked={selectedTreatment === 'PHYSIO'} />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid item xs={6}>
                      <Card 
                        variant="outlined" 
                        sx={{ 
                          borderColor: selectedTreatment === 'MASSAGE' ? 'grey.700' : 'grey.300',
                          borderWidth: selectedTreatment === 'MASSAGE' ? 2 : 1,
                          cursor: 'pointer',
                          '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                        }}
                        onClick={() => setSelectedTreatment('MASSAGE')}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ bgcolor: 'grey.500' }}>
                              <SelfImprovementIcon />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1">Massage</Typography>
                              <Typography variant="caption" color="textSecondary">
                                45% Match
                              </Typography>
                            </Box>
                            <Radio checked={selectedTreatment === 'MASSAGE'} />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </Box>
              )}

              {/* Step 2: Choose Staff & Time */}
              {activeStep === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Select Staff & Time
                  </Typography>

                  {/* Date Selection */}
                  <Typography variant="subtitle2" gutterBottom>
                    Select Date
                  </Typography>
                  <Grid container spacing={1} sx={{ mb: 3 }}>
                    {getDates().map((date, index) => {
                      const dateStr = formatDate(date);
                      return (
                        <Grid item xs={6} sm={3} md={2} key={index}>
                          <Card 
                            variant="outlined"
                            sx={{ 
                              cursor: 'pointer',
                              textAlign: 'center',
                              bgcolor: selectedDate === dateStr ? 'primary.light' : 'white',
                              color: selectedDate === dateStr ? 'white' : 'inherit',
                              '&:hover': { bgcolor: selectedDate === dateStr ? 'primary.light' : 'grey.100' }
                            }}
                            onClick={() => setSelectedDate(dateStr)}
                          >
                            <CardContent sx={{ py: 1 }}>
                              <Typography variant="caption" display="block">
                                {date.toLocaleDateString('en-US', { weekday: 'short' })}
                              </Typography>
                              <Typography variant="h6">
                                {date.getDate()}
                              </Typography>
                              <Typography variant="caption">
                                {date.toLocaleDateString('en-US', { month: 'short' })}
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                      );
                    })}
                  </Grid>

                  {/* Available Staff */}
                  {selectedDate && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Available Staff
                      </Typography>
                      
                      {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                          <CircularProgress />
                        </Box>
                      ) : (
                        <Grid container spacing={2} sx={{ mb: 3 }}>
                          {availableStaff.length === 0 ? (
                            <Grid item xs={12}>
                              <Typography color="textSecondary" align="center" py={4}>
                                No staff available for this date. Please select another date.
                              </Typography>
                            </Grid>
                          ) : (
                            availableStaff.map((staff) => (
                              <Grid item xs={12} sm={6} key={staff._id}>
                                <TherapistCard 
                                  sx={{ 
                                    border: selectedStaff?._id === staff._id ? `2px solid` : '2px solid transparent',
                                    borderColor: 'primary.main'
                                  }}
                                  onClick={() => handleStaffSelect(staff)}
                                >
                                  <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                      <Avatar src={staff.image}>
                                        <PersonIcon />
                                      </Avatar>
                                      <Box>
                                        <Typography variant="subtitle2">
                                          {staff.name}
                                        </Typography>
                                        <Typography variant="caption" display="block" color="textSecondary">
                                          {staff.specialization} • {staff.experience} years
                                        </Typography>
                                        {staff.bio && (
                                          <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                                            {staff.bio.substring(0, 60)}...
                                          </Typography>
                                        )}
                                      </Box>
                                    </Box>
                                  </CardContent>
                                </TherapistCard>
                              </Grid>
                            ))
                          )}
                        </Grid>
                      )}

                      {/* Available Time Slots */}
                      {selectedStaff && availableSlots.length > 0 && (
                        <>
                          <Typography variant="subtitle2" gutterBottom>
                            Available Time Slots for {selectedStaff.name}
                          </Typography>
                          <Grid container spacing={1} sx={{ mb: 3 }}>
                            {availableSlots.map((slot, index) => (
                              <Grid item xs={6} sm={4} md={3} key={index}>
                                <TimeSlotButton
                                  fullWidth
                                  selected={selectedTimeSlot === slot}
                                  onClick={() => setSelectedTimeSlot(slot)}
                                >
                                  {slot.startTime} - {slot.endTime}
                                </TimeSlotButton>
                              </Grid>
                            ))}
                          </Grid>
                        </>
                      )}

                      {/* Additional Notes */}
                      <TextField
                        fullWidth
                        label="Additional Notes (Optional)"
                        multiline
                        rows={3}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any specific concerns or requests..."
                        sx={{ mt: 2 }}
                      />
                    </>
                  )}
                </Box>
              )}

              {/* Step 3: Confirm Details */}
              {activeStep === 2 && selectedStaff && selectedTimeSlot && (
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Confirm Your Appointment
                  </Typography>
                  <Typography variant="body2" color="textSecondary" paragraph>
                    Please review your details before submitting
                  </Typography>

                  <Card variant="outlined" sx={{ mb: 3 }}>
                    <CardContent>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Treatment
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {getTreatmentIcon(selectedTreatment)}
                            <Typography>
                              {getTreatmentName(selectedTreatment)}
                            </Typography>
                          </Box>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Divider />
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Staff
                          </Typography>
                          <Typography>{selectedStaff.name}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {selectedStaff.specialization} • {selectedStaff.experience} years
                          </Typography>
                        </Grid>
                        
                        <Grid item xs={6}>
                          <Typography variant="subtitle2" color="primary" gutterBottom>
                            Date & Time
                          </Typography>
                          <Typography>{formatDisplayDate(selectedDate)}</Typography>
                          <Typography variant="caption" color="textSecondary">
                            {selectedTimeSlot.startTime} - {selectedTimeSlot.endTime}
                          </Typography>
                        </Grid>
                        
                        {notes && (
                          <>
                            <Grid item xs={12}>
                              <Divider />
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="subtitle2" color="primary" gutterBottom>
                                Notes
                              </Typography>
                              <Typography variant="body2">{notes}</Typography>
                            </Grid>
                          </>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Right Column - Summary */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
              <Typography variant="h6" gutterBottom>
                Appointment Summary
              </Typography>
              
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="textSecondary">
                  Selected Treatment
                </Typography>
                <Typography variant="body1" gutterBottom>
                  {selectedTreatment ? getTreatmentName(selectedTreatment) : 'Not selected'}
                </Typography>
              </Box>

              {selectedStaff && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Staff
                  </Typography>
                  <Typography variant="body1">{selectedStaff.name}</Typography>
                </Box>
              )}

              {selectedDate && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Date
                  </Typography>
                  <Typography variant="body1">{formatDisplayDate(selectedDate)}</Typography>
                </Box>
              )}

              {selectedTimeSlot && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" color="textSecondary">
                    Time
                  </Typography>
                  <Typography variant="body1">
                    {selectedTimeSlot.startTime} - {selectedTimeSlot.endTime}
                  </Typography>
                </Box>
              )}

              <Box sx={{ mt: 4 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleNext}
                  disabled={
                    (activeStep === 0 && !selectedTreatment) ||
                    (activeStep === 1 && (!selectedDate || !selectedStaff || !selectedTimeSlot)) ||
                    submitting
                  }
                >
                  {activeStep === steps.length - 1 
                    ? (submitting ? 'Booking...' : 'Confirm Booking')
                    : 'Next'
                  }
                </Button>
                
                {activeStep > 0 && (
                  <Button
                    fullWidth
                    onClick={handleBack}
                    sx={{ mt: 2 }}
                  >
                    Back
                  </Button>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Container>

      <Footer />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </Box>
  );
};

export default AppointmentBooking;