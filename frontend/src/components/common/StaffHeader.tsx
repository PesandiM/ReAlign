import React from 'react';
import { AppBar, Toolbar, Typography, Box } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface StaffHeaderProps {
  title: string;
}

const StaffHeader: React.FC<StaffHeaderProps> = ({ title }) => {
  const navigate = useNavigate();

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Toolbar>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography
            variant="h6"
            component="div"
            sx={{
              cursor: 'pointer',
              fontWeight: 'bold',
              color: 'primary.main'
            }}
            onClick={() => navigate('/staff')}
          >
            ReAlign Staff
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Typography variant="subtitle1" color="textSecondary">
          {title}
        </Typography>
      </Toolbar>
    </AppBar>
  );
};

export default StaffHeader;