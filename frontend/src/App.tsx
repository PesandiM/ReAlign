import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Home from './pages/Home';
import SymptomChecker from './pages/SymptomChecker';
import AppointmentBooking from './pages/AppointmentBooking';

const theme = createTheme({
  palette: {
    primary: {
      main: '#525449', // Calming green
      light: '#e5e2d6',
      dark: '#c5c3b8',
    },
    secondary: {
      main: '#1976D2', // Trust blue
      light: '#42A5F5',
      dark: '#1565C0',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontWeight: 700,
    },
    h2: {
      fontWeight: 600,
    },
    h3: {
      fontWeight: 600,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
    h6: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 500,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
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
          <Route path="/" element={<Home />} />
          <Route path="/symptom-check" element={<SymptomChecker />} />
          <Route path="/appointment-book" element={<AppointmentBooking/>} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;