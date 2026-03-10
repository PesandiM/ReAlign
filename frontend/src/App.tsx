import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Public pages
import Home from './pages/Home';
import SymptomChecker from './pages/SymptomChecker';
import AppointmentBooking from './pages/AppointmentBooking';
import Login from './pages/Login';
import SignUp from './pages/SignUp';

// Dashboard pages
import PatientDashboard from './pages/PatientDashboard';
import StaffDashboard from './pages/StaffDashboardPage';

// Auth guard
import ProtectedRoute from './components/auth/ProtectedRoute';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4d4f44',
      light: '#6a6c60',
      dark: '#35362e',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#525449',
      light: '#6b6d62',
      dark: '#3a3c34',
      contrastText: '#ffffff',
    },
    background: {
      default: '#e5e2d6',
      paper: '#ffffff',
    },
    text: {
      primary: '#2c2e26',
      secondary: '#6b6d62',
    },
    error: {
      main: '#b85c4b',
    },
    warning: {
      main: '#9e8b6d',
    },
    success: {
      main: '#4d4f44',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
        contained: {
          backgroundColor: '#4d4f44',
          '&:hover': {
            backgroundColor: '#6a6c60',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: '1px solid #d1cec2',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          border: '1px solid #d1cec2',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#e5e2d6',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#e5e2d6',
          color: '#ffffff',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          '&.Mui-selected': {
            backgroundColor: '#525449',
            '&:hover': {
              backgroundColor: '#6b6d62',
            },
          },
          '&:hover': {
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/symptom-check" element={<SymptomChecker />} />
          <Route path="/appointment-book" element={<AppointmentBooking />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          {/* Patient Dashboard - all routes under /patient */}
          <Route path="/patient/*" element={
            <ProtectedRoute role="patient">
              <PatientDashboard />
            </ProtectedRoute>
          } />

          {/* Staff Dashboard - all routes under /staff */}
          <Route path="/staff/*" element={
            <ProtectedRoute role="staff">
              <StaffDashboard />
            </ProtectedRoute>
          } />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;