import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { useNavigate } from 'react-router-dom';
import TCHLogo from '../../../src/utils/TCH-bg.png';

interface HeaderProps {
  onLoginClick: () => void;
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  return (
    <AppBar position="static" color="default" elevation={1}>
      <Container maxWidth="lg">
        <Toolbar disableGutters>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              component="img"
              src={TCHLogo}
              alt="The Chiro House Logo"
              sx={{
                height: 100,
                cursor: 'pointer'
              }}
              onClick={() => navigate('/')}
            />
            <Typography
              variant="h6"
              component="div"
              sx={{
                cursor: 'pointer',
                fontWeight: 'bold',
                color: 'primary.main'
              }}
              onClick={() => navigate('/')}
            >
              ReAlign
            </Typography>
          </Box>
          <Box sx={{ flexGrow: 1 }} />

          {isMobile ? (
            <IconButton color="inherit">
              <MenuIcon />
            </IconButton>
          ) : (
            <Box>
              <Button color="inherit" onClick={() => navigate('/')}>
                Home
              </Button>
              <Button color="inherit" onClick={() => navigate('/symptom-check')}>
                AI treatment recommendation
              </Button>
              <Button color="inherit" onClick={onLoginClick}>
                Book Appointment
              </Button>
              <Button 
                variant="contained" 
                onClick={onLoginClick}
                sx={{ ml: 2 }}
              >
                Login | Sign-up
              </Button>
            </Box>
          )}
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Header;