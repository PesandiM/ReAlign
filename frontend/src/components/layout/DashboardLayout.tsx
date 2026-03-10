import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Container
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import AppSidebar from '../common/AppSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  userRole: 'patient' | 'staff';
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, title, userRole }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f5f7fa' }}>
      <AppSidebar 
        mobileOpen={mobileOpen} 
        onDrawerToggle={handleDrawerToggle} 
        userRole={userRole}
        onLogout={handleLogout}
      />
      
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" color="default" elevation={1} sx={{ bgcolor: 'white' }}>
          <Toolbar>
            <IconButton
              color="inherit"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ mr: 2, display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              {title}
            </Typography>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 4 }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default DashboardLayout;