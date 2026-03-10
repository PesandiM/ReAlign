import React from 'react';
import {
  Box, Drawer, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, Typography, Avatar, Divider, Chip
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import PeopleIcon from '@mui/icons-material/People';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LogoutIcon from '@mui/icons-material/Logout';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import BarChartIcon from '@mui/icons-material/BarChart';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import { authService } from '../../services/authService';

const drawerWidth = 280;

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  roles: ('patient' | 'staff' | 'admin')[];
  adminOnly?: boolean;
}

interface AppSidebarProps {
  mobileOpen: boolean;
  onDrawerToggle: () => void;
  userRole: 'patient' | 'staff';
  onLogout: () => void;
}

const AppSidebar: React.FC<AppSidebarProps> = ({ mobileOpen, onDrawerToggle, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : { name: 'User', email: 'user@example.com', role: 'staff' };
  const userRole = (authService.getUserRole() || user.role) as string;

  const menuItems: MenuItem[] = [
    // ── Patient items ──────────────────────────────────────────────────────
    { id: 'dashboard',    label: 'Dashboard',         icon: <DashboardIcon />,    path: '/patient',              roles: ['patient'] },
    { id: 'p-appts',      label: 'My Appointments',   icon: <CalendarMonthIcon />,path: '/patient/appointments', roles: ['patient'] },
    { id: 'history',      label: 'Treatment History', icon: <HistoryIcon />,      path: '/patient/history',      roles: ['patient'] },
    { id: 'p-profile',    label: 'Profile',           icon: <PersonIcon />,       path: '/patient/profile',      roles: ['patient'] },

    // ── Staff + Admin shared items ─────────────────────────────────────────
    { id: 'staff-home',   label: 'Dashboard',         icon: <DashboardIcon />,    path: '/staff',                roles: ['staff', 'admin'] },
    { id: 's-appts',      label: 'Appointments',      icon: <CalendarMonthIcon />,path: '/staff/appointments',   roles: ['staff', 'admin'] },
    { id: 'therapists',   label: 'Therapists',        icon: <PeopleIcon />,       path: '/staff/therapists',     roles: ['staff', 'admin'] },
    { id: 'treatments',   label: 'Treatments',        icon: <FitnessCenterIcon />,path: '/staff/treatments',     roles: ['staff', 'admin'] },
    { id: 'availability', label: 'Availability',      icon: <AccessTimeIcon />,   path: '/staff/availability',   roles: ['staff', 'admin'] },

    // ── Admin-only items ───────────────────────────────────────────────────
    { id: 'users',        label: 'User Management',   icon: <ManageAccountsIcon />,path: '/staff/users',          roles: ['admin'], adminOnly: true },
    { id: 'analytics',    label: 'Analytics',         icon: <BarChartIcon />,     path: '/staff/analytics',      roles: ['admin'], adminOnly: true },
  ];

  const filteredItems = menuItems.filter(item =>
    item.roles.includes(userRole as any)
  );

  const handleNav = (path: string) => {
    navigate(path);
    if (mobileOpen) onDrawerToggle();
  };

  const roleLabel = userRole === 'admin' ? 'Administrator' : userRole === 'staff' ? 'Staff Member' : 'Patient';
  const roleColor = userRole === 'admin' ? '#FFD700' : userRole === 'staff' ? '#90CAF9' : '#A5D6A7';

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#4d4f44', color: 'white' }}>
      {/* Brand */}
      <Box sx={{ px: 3, pt: 3, pb: 2 }}>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', letterSpacing: 2, textTransform: 'uppercase', fontSize: '10px' }}>
          The Chiro House
        </Typography>
        <Typography variant="h6" sx={{ color: 'white', fontWeight: 700, lineHeight: 1.2, mt: 0.5 }}>
          ReAlign Portal
        </Typography>
      </Box>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />

      {/* User Info */}
      <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Avatar sx={{ bgcolor: '#e5e2d6', color: '#4d4f44', width: 44, height: 44, fontWeight: 700, fontSize: '16px' }}>
          {user.name?.charAt(0)?.toUpperCase() || 'U'}
        </Avatar>
        <Box sx={{ overflow: 'hidden' }}>
          <Typography variant="body2" sx={{ fontWeight: 600, color: 'white', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.name}
          </Typography>
          <Chip
            label={roleLabel}
            size="small"
            sx={{
              height: 18, fontSize: '10px', mt: 0.5,
              bgcolor: userRole === 'admin' ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.1)',
              color: roleColor,
              border: `1px solid ${roleColor}40`,
              '& .MuiChip-label': { px: 1 }
            }}
          />
        </Box>
      </Box>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />

      {/* Admin badge */}
      {userRole === 'admin' && (
        <Box sx={{ mx: 2, my: 1.5, p: 1.5, bgcolor: 'rgba(255,215,0,0.08)', borderRadius: 2, border: '1px solid rgba(255,215,0,0.2)', display: 'flex', alignItems: 'center', gap: 1 }}>
          <AdminPanelSettingsIcon sx={{ fontSize: 16, color: '#FFD700' }} />
          <Typography variant="caption" sx={{ color: '#FFD700', fontWeight: 600 }}>
            Full Admin Access
          </Typography>
        </Box>
      )}

      {/* Nav Items */}
      <List sx={{ flex: 1, px: 1.5, py: 1 }}>
        {filteredItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/staff' && item.path !== '/patient' && location.pathname.startsWith(item.path));
          return (
            <ListItem key={item.id} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={isActive}
                onClick={() => handleNav(item.path)}
                sx={{
                  borderRadius: 2,
                  py: 1,
                  color: 'rgba(255,255,255,0.75)',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: 'white' },
                  '&.Mui-selected': {
                    bgcolor: item.adminOnly ? 'rgba(255,215,0,0.15)' : 'rgba(255,255,255,0.12)',
                    color: item.adminOnly ? '#FFD700' : 'white',
                    '&:hover': { bgcolor: item.adminOnly ? 'rgba(255,215,0,0.2)' : 'rgba(255,255,255,0.15)' },
                  },
                }}
              >
                <ListItemIcon sx={{
                  minWidth: 36,
                  color: isActive
                    ? (item.adminOnly ? '#FFD700' : 'white')
                    : 'rgba(255,255,255,0.5)'
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: '13px', fontWeight: isActive ? 600 : 400 }}
                />
                {item.adminOnly && (
                  <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#FFD700', ml: 1 }} />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ bgcolor: 'rgba(255,255,255,0.1)' }} />

      {/* Logout */}
      <List sx={{ px: 1.5, py: 1 }}>
        <ListItem disablePadding>
          <ListItemButton onClick={onLogout} sx={{ borderRadius: 2, color: 'rgba(255,255,255,0.6)', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: 'white' } }}>
            <ListItemIcon sx={{ minWidth: 36, color: 'rgba(255,255,255,0.5)' }}>
              <LogoutIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Logout" primaryTypographyProps={{ fontSize: '13px' }} />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
      <Drawer variant="temporary" open={mobileOpen} onClose={onDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', sm: 'none' }, '& .MuiDrawer-paper': { width: drawerWidth, bgcolor: '#4d4f44' } }}>
        {drawer}
      </Drawer>
      <Drawer variant="permanent"
        sx={{ display: { xs: 'none', sm: 'block' }, '& .MuiDrawer-paper': { width: drawerWidth, bgcolor: '#4d4f44', borderRight: '1px solid #525449' } }}
        open>
        {drawer}
      </Drawer>
    </Box>
  );
};

export default AppSidebar;