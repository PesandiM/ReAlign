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
import InstagramIcon from '@mui/icons-material/Instagram';
import WhatsappIcon from '@mui/icons-material/WhatsApp';

const Footer: React.FC = () => {
  return (
    <Box component="footer" sx={{ bgcolor: 'grey.100', py: 6, mt: 'auto' }}>
      <Container maxWidth="lg">
        <Grid container spacing={4}>

          {/* ── Brand ── */}
          <Grid item xs={12} md={3}>
            <Typography variant="h6" color="primary" gutterBottom>
              ReAlign
            </Typography>
            <Typography variant="body2" color="textSecondary">
              AI-Powered Treatment Prediction and Appointment Scheduling optimizer for The Chiro House
            </Typography>
          </Grid>

          {/* ── Quick Links ── */}
          <Grid item xs={12} md={2}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Link href="/" color="inherit" underline="hover">Home</Link>
              <Link href="/appointment-book" color="inherit" underline="hover">Book Appointments</Link>
              <Link href="https://www.thechirohouse.lk/" color="inherit" underline="hover" target="_blank" rel="noopener">About Us</Link>
              <Link href="/contact" color="inherit" underline="hover">Contact</Link>
            </Box>
          </Grid>

          {/* ── Contact ── */}
          <Grid item xs={12} md={3}>
            <Typography variant="h6" gutterBottom>
              Contact Info
            </Typography>
            <Typography variant="body2" color="textSecondary">
              The Chiro House (Pvt) Ltd<br />
              14 Skelton Road, Colombo 05<br />
              Sri Lanka<br />
              Phone: + (94) 777-263-173<br />
              Phone: + (94) 112-137-661<br />
              Email: admin.chirohouse@gmail.com
            </Typography>
            <Box sx={{ mt: 2 }}>
              <IconButton color="primary" size="small"
                href="https://wa.me/94777263173" target="_blank" rel="noopener">
                <WhatsappIcon />
              </IconButton>
              <IconButton color="primary" size="small"
                href="https://www.facebook.com/thechirohouse" target="_blank" rel="noopener">
                <FacebookIcon />
              </IconButton>
              <IconButton color="primary" size="small"
                href="https://www.instagram.com/thechirohouse" target="_blank" rel="noopener">
                <InstagramIcon />
              </IconButton>
            </Box>
          </Grid>

          {/* ── Google Map ── */}
          <Grid item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Find Us
            </Typography>
            <Box sx={{
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              lineHeight: 0, // removes gap under iframe
            }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3961.0340841258067!2d79.8633524!3d6.886520899999999!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3ae259056bbbe969%3A0x675a10dc133afb22!2sThe%20Chiro%20House%20Colombo!5e0!3m2!1sen!2slk!4v1773119944288!5m2!1sen!2slk"
                width="100%"
                height="180"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="The Chiro House location"
              />
            </Box>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, display: 'block' }}>
              14 Skelton Road, Colombo 05
            </Typography>
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