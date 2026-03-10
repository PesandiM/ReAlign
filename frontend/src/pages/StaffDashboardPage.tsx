import React, { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import {
  Typography, Grid, Card, CardContent, Paper, Button, Box, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  LinearProgress, Divider
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleIcon from '@mui/icons-material/People';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import DashboardLayout from '../components/layout/DashboardLayout';
import AppointmentManagement from '../components/staff/AppointmentManagement';
import TherapistManagement from '../components/staff/TherapistManagement';
import TreatmentManagement from '../components/staff/TreatmentManagement';
import AvailabilityManager from '../components/staff/AvailabilityManager';
import UserManagement from '../components/staff/UserManagement';
import { staffService } from '../services/staffService';
import { authService } from '../services/authService';

const AdminAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const data = await staffService.getDashboard();
      setAnalytics(data);
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LinearProgress />;

  const overview = analytics?.overview || {};

  const statCards = [
    { label: "Today's Appointments", value: overview.today_appointments ?? 0, icon: <CalendarTodayIcon />, color: '#4CAF50', bg: '#E8F5E9' },
    { label: 'Pending Requests',      value: overview.pending_appointments ?? 0, icon: <TrendingUpIcon />,   color: '#FF9800', bg: '#FFF3E0' },
    { label: 'Active Therapists',     value: overview.active_therapists ?? 0,    icon: <LocalHospitalIcon />, color: '#2196F3', bg: '#E3F2FD' },
    { label: 'Total Treatments',      value: overview.total_treatments ?? 0,     icon: <LocalHospitalIcon />, color: '#9C27B0', bg: '#F3E5F5' },
    { label: 'Total Patients',        value: overview.total_patients ?? 0,       icon: <PeopleIcon />,        color: '#E91E63', bg: '#FCE4EC' },
    { label: 'Total Users',           value: overview.total_users ?? 0,          icon: <PeopleIcon />,        color: '#607D8B', bg: '#ECEFF1' },
  ];

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #4d4f44 0%, #6a6c60 100%)', color: 'white', borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700}>Admin Analytics</Typography>
        <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
          Real-time clinic performance overview
        </Typography>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {statCards.map((card, i) => (
          <Grid item xs={12} sm={6} md={4} key={i}>
            <Card sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', border: 'none' }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 3 }}>
                <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: card.bg, color: card.color, display: 'flex' }}>
                  {card.icon}
                </Box>
                <Box>
                  <Typography variant="h4" fontWeight={700} color={card.color}>{card.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Today's Schedule</Typography>
            <Divider sx={{ mb: 2 }} />
            {analytics?.today_appointments?.length > 0 ? (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600 }}>Time</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Patient</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Treatment</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {analytics.today_appointments.slice(0, 8).map((apt: any, idx: number) => (
                      <TableRow key={idx} hover>
                        <TableCell>{apt.time}</TableCell>
                        <TableCell>{apt.patient?.name || 'N/A'}</TableCell>
                        <TableCell>{apt.treatment?.name || 'N/A'}</TableCell>
                        <TableCell>
                          <Chip label={apt.status} size="small"
                            color={apt.status === 'confirmed' ? 'success' : apt.status === 'pending' ? 'warning' : 'default'} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                No appointments scheduled for today
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Pending Requests</Typography>
            <Divider sx={{ mb: 2 }} />
            {analytics?.pending_appointments?.length > 0 ? (
              analytics.pending_appointments.slice(0, 5).map((apt: any, idx: number) => (
                <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, p: 1.5, bgcolor: '#FFF8E1', borderRadius: 2 }}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{apt.patient?.name || 'Patient'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {apt.treatment?.name || 'Treatment'} · {apt.date} at {apt.time}
                    </Typography>
                  </Box>
                  <Chip label="Pending" size="small" color="warning" />
                </Box>
              ))
            ) : (
              <Typography color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                No pending requests
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

const StaffHome: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const userRole = authService.getUserRole();

  useEffect(() => {
    staffService.getDashboard()
      .then(data => setDashboardData(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LinearProgress />;

  const overview = dashboardData?.overview || {};

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 4, background: 'linear-gradient(135deg, #4d4f44 0%, #6a6c60 100%)', color: 'white', borderRadius: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          {userRole === 'admin' ? 'Admin Dashboard' : 'Staff Dashboard'}
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.85, mt: 0.5 }}>
          {userRole === 'admin'
            ? 'Full system access — manage all clinic operations'
            : 'Manage appointments, treatments and therapist schedules'}
        </Typography>
      </Paper>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {[
          { label: "Today's Appointments", value: overview.today_appointments ?? 0, color: '#4CAF50' },
          { label: 'Pending Requests',     value: overview.pending_appointments ?? 0, color: '#FF9800' },
          { label: 'Active Therapists',    value: overview.active_therapists ?? 0,    color: '#2196F3' },
          { label: 'Total Treatments',     value: overview.total_treatments ?? 0,     color: '#9C27B0' },
        ].map((stat, i) => (
          <Grid item xs={12} sm={6} md={3} key={i}>
            <Card sx={{ textAlign: 'center', py: 3, borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Typography variant="h3" fontWeight={700} sx={{ color: stat.color }}>{stat.value}</Typography>
                <Typography variant="subtitle2" color="text.secondary">{stat.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>Today's Appointments</Typography>
            <Divider sx={{ mb: 2 }} />
            {dashboardData?.today_appointments?.length > 0 ? (
              dashboardData.today_appointments.slice(0, 5).map((apt: any, idx: number) => (
                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5, p: 1.5, bgcolor: '#F5F5F5', borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={600} sx={{ minWidth: 50 }}>{apt.time}</Typography>
                  <Typography variant="body2" sx={{ flex: 1 }}>{apt.patient?.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{apt.treatment?.name}</Typography>
                  <Chip label={apt.status} size="small"
                    color={apt.status === 'confirmed' ? 'success' : 'warning'} />
                </Box>
              ))
            ) : (
              <Typography color="text.secondary" sx={{ py: 2 }}>No appointments today</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

// Staff Dashboard Page 
const StaffDashboardPage: React.FC = () => {
  const userRole = authService.getUserRole();

  return (
    <DashboardLayout title="The Chiro House — Staff Portal" userRole="staff">
      <Routes>
        <Route path="/"             element={<StaffHome />} />
        <Route path="/appointments" element={<AppointmentManagement />} />
        <Route path="/therapists"   element={<TherapistManagement />} />
        <Route path="/treatments"   element={<TreatmentManagement />} />
        <Route path="/availability" element={<AvailabilityManager />} />
        {/* Admin-only routes */}
        {userRole === 'admin' && (
          <>
            <Route path="/users"     element={<UserManagement />} />
            <Route path="/analytics" element={<AdminAnalytics />} />
          </>
        )}
      </Routes>
    </DashboardLayout>
  );
};

export default StaffDashboardPage;