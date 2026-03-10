import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HealingIcon from '@mui/icons-material/Healing';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import LoginModal from '../components/common/LoginModal';

const HeroSection = styled(Box)(({ theme }) => ({
  backgroundImage: 'url("/images/TCH-front.png")',
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  backgroundRepeat: 'no-repeat',
  color: 'white',
  padding: theme.spacing(15, 0),
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundImage: 'inherit',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(2px) brightness(0.8)',
    zIndex: 0
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(135deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0.1) 100%)',
    zIndex: 1
  },
  '& > *': {
    position: 'relative',
    zIndex: 2
  }
}));

const FeatureCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  textAlign: 'center',
  height: '100%',
  backgroundColor: 'white',
  transition: 'transform 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-8px)',
    boxShadow: theme.shadows[8],
  },
}));

const Home: React.FC = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ backgroundColor: '#e5e2d6', minHeight: '100vh' }}> {/* Website background color */}
      <Header onLoginClick={() => setLoginOpen(true)} />
      
      {/* Hero Section with Background Image - Full Width */}
      <HeroSection>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', py: { xs: 4, md: 8 } }}>
            <Typography 
              variant={isMobile ? 'h3' : 'h2'} 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 'bold',
                color: 'white',
                textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
              }}
            >
              ReAlign
            </Typography>
            <Typography 
              variant={isMobile ? 'h6' : 'h5'} 
              paragraph 
              sx={{ 
                mb: 4, 
                maxWidth: '800px', 
                mx: 'auto',
                color: 'white',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}
            >
              ALIGN | RELEASE | THRIVE
            </Typography>
            <Typography 
              variant="body1" 
              paragraph 
              sx={{ 
                mb: 4, 
                maxWidth: '600px', 
                mx: 'auto',
                color: 'white',
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)'
              }}
            >
              Get instant treatment recommendations based on your symptoms and book
              appointments with our in-house therapists
            </Typography>
            <Button
              variant="contained"
              size="large"
              endIcon={<ArrowForwardIcon />}
              href="/symptom-check"
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'grey.100',
                },
                py: 1.5,
                px: 4,
              }}
            >
              Get recommendations
            </Button>
          </Box>
        </Container>
      </HeroSection>

      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Typography 
          variant="h4" 
          component="h2" 
          align="center" 
          gutterBottom
          sx={{ mb: 4, fontWeight: 'bold', color: '#333' }}
        >
          How It Works
        </Typography>

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <FeatureCard elevation={2}>
              <HealingIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                1. Describe Symptoms
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Tell us what you're experiencing. Use text or voice input to describe your symptoms in detail.
              </Typography>
            </FeatureCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard elevation={2}>
              <SmartToyIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                2. AI Analysis
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Our AI analyzes your symptoms and provides personalized treatment recommendations with confidence scores.
              </Typography>
            </FeatureCard>
          </Grid>
          <Grid item xs={12} md={4}>
            <FeatureCard elevation={2}>
              <CalendarMonthIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                3. Book Appointment
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Choose from AI-recommended time slots and get instant confirmation from our staff.
              </Typography>
            </FeatureCard>
          </Grid>
        </Grid>
      </Container>

      {/* Trust Indicators */}
      <Container maxWidth="lg" sx={{ pb: 8 }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2" color="textSecondary" paragraph>
            Trusted by The Chiro House • Secure & Confidential • AI-Assisted Diagnosis
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 3, flexWrap: 'wrap' }}>
            <Typography variant="caption" color="textSecondary">✓ 1000+ Patients</Typography>
            <Typography variant="caption" color="textSecondary">✓ 98% Satisfaction</Typography>
            <Typography variant="caption" color="textSecondary">✓ 24/7 Availability</Typography>
          </Box>
        </Box>
      </Container>

      <Footer />
      <LoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </Box>
  );
};

export default Home;