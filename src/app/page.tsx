'use client';

import Link from "next/link";
import { Box, Container, Typography, Button } from "@mui/material";
import DashboardIcon from '@mui/icons-material/Dashboard';

export default function Home() {
  const videoSources = [
    "https://videos.pexels.com/video-files/1739010/1739010-hd_1920_1080_30fps.mp4", // Blue ocean drone footage
  ];

  return (
    <Box 
      sx={{ 
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        backgroundColor: '#2c2c2c',
        color: 'white',
        overflow: 'hidden'
      }}
    >
      {/* Video Background */}
      <Box sx={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <Box
          component="video"
          autoPlay
          muted
          loop
          playsInline
          sx={{
            objectFit: 'cover',
            width: '100%',
            height: '100%',
            filter: 'brightness(0.3)'
          }}
        >
          <source src={videoSources[0]} type="video/mp4" />
          Your browser does not support the video tag.
        </Box>
        
        {/* Overlay gradient for better text readability */}
        <Box 
          sx={{ 
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 100%)'
          }}
        />
      </Box>
      
      <Box 
        sx={{ 
          flexGrow: 1,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'relative',
          zIndex: 10,
        }}
      >
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <Typography 
            variant="h2" 
            component="h1"
            sx={{ 
              fontWeight: 700,
              letterSpacing: '-0.5px',
              lineHeight: 1.2,
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              mb: 5
            }}
          >
            AI Travel Planner
          </Typography>
          
          <Button
            component={Link}
            href="/dashboard"
            variant="contained"
            size="large"
            startIcon={<DashboardIcon />}
            sx={{
              backgroundColor: '#90caf9',
              color: '#000',
              px: 5,
              py: 2,
              fontSize: '1.2rem',
              textTransform: 'none',
              '&:hover': {
                backgroundColor: '#6ba8de',
              },
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            Go to Dashboard
          </Button>
        </Container>
      </Box>
    </Box>
  );
}
