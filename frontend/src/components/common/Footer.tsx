import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  Link,
  IconButton,
  Divider
} from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import WhatsappIcon from '@mui/icons-material/WhatsApp';

const Footer: React.FC = () => {
  return (
    <Box component="footer" sx={{ bgcolor: 'grey.100', py: 6, mt: 'auto' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" color="primary" gutterBottom>
              ReAlign
            </Typography>
            <Typography variant="body2" color="textSecondary">
              AI-Powered Treatment Prediction and Appointment Scheduling for The Chiro House
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/" color="inherit" underline="hover">Home</Link>
              <Link href="/symptom-check" color="inherit" underline="hover">Symptom Checker</Link>
              <Link href="https://www.thechirohouse.lk/" color="inherit" underline="hover">About Us</Link>
              <Link href="/contact" color="inherit" underline="hover">Contact</Link>
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>  {/* ← Change from size to item */}
            <Typography variant="h6" gutterBottom>
              Contact Info
            </Typography>
            <Typography variant="body2" color="textSecondary">
              The Chiro House (Pvt) Ltd<br />
              14 Skelton Road, Colombo 05<br />
              Sri Lanka<br />
              Phone: + (94) 777-263-173<br />
              Phone: + (94) 112-137-661<br />
              Email: book@thechirohouse.lk
            </Typography>
            <Box sx={{ mt: 2 }}>
                <IconButton color="primary" size="small">
                    <WhatsappIcon />
                </IconButton>
                <IconButton color="primary" size="small">
                    <FacebookIcon />
                </IconButton>
                <IconButton color="primary" size="small">
                    <InstagramIcon />
                </IconButton>
            </Box>
          </Grid>
        </Grid>
        <Divider sx={{ my: 3 }} />
        <Typography variant="body2" color="textSecondary" align="center">
          © {new Date().getFullYear()} ReAlign. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;