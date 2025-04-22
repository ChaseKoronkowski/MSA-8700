'use client';

import { Container, Typography, Box, Paper, Button } from '@mui/material';
import { useRouter } from 'next/navigation';
import StorageIcon from '@mui/icons-material/Storage';
import MapIcon from '@mui/icons-material/Map';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';

export default function DashboardPage() {
  const router = useRouter();

  const dashboardCards = [
    {
      title: 'View All Recommendations',
      description: 'Browse through all your generated travel recommendations',
      icon: <StorageIcon sx={{ fontSize: 50, color: '#90caf9', mb: 2 }} />,
      link: '/dashboard/view-all-recommendations',
      buttonText: 'View Recommendations'
    },
    {
      title: 'Route Plans',
      description: 'Access your saved travel route plans',
      icon: <MapIcon sx={{ fontSize: 50, color: '#90caf9', mb: 2 }} />,
      link: '/dashboard/route-plan',
      buttonText: 'View Route Plans'
    },
    {
      title: 'Create New Recommendation',
      description: 'Generate a new travel recommendation based on your preferences',
      icon: <TravelExploreIcon sx={{ fontSize: 50, color: '#90caf9', mb: 2 }} />,
      link: '/recommendation',
      buttonText: 'Create New'
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      backgroundColor: '#2c2c2c', 
      color: 'white',
      py: 5
    }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 6, pl: 2 }}>
          <Typography 
            variant="h4" 
            component="h1" 
            fontWeight="400" 
            sx={{ 
              mb: 1,
              letterSpacing: '0.5px',
              color: '#f5f5f5'
            }}
          >
            Travel Dashboard
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 300,
              maxWidth: '600px'
            }}
          >
            Access and manage your travel recommendations and route plans
          </Typography>
        </Box>
        
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(3, 1fr)'
            },
            gap: 3
          }}
        >
          {dashboardCards.map((card, index) => (
            <Paper 
              key={index}
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                textAlign: 'left',
                backgroundColor: '#333333',
                color: 'white',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                borderRadius: 2,
                transition: 'all 0.2s ease-in-out',
                border: '1px solid rgba(255,255,255,0.05)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
                  backgroundColor: '#3a3a3a',
                  borderColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <Box sx={{ alignSelf: 'flex-start', mb: 1 }}>
                {card.icon}
              </Box>
              <Typography 
                variant="h6" 
                component="h2" 
                gutterBottom 
                sx={{ 
                  fontWeight: 500,
                  color: '#f5f5f5',
                  mb: 1
                }}
              >
                {card.title}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'rgba(255, 255, 255, 0.7)',
                  mb: 3,
                  lineHeight: 1.5
                }}
              >
                {card.description}
              </Typography>
              <Box sx={{ mt: 'auto', alignSelf: 'flex-start' }}>
                <Button 
                  variant="outlined"
                  onClick={() => router.push(card.link)}
                  sx={{ 
                    borderColor: '#90caf9',
                    color: '#90caf9',
                    textTransform: 'none',
                    fontWeight: 400,
                    px: 2,
                    '&:hover': {
                      backgroundColor: 'rgba(144, 202, 249, 0.08)',
                      borderColor: '#90caf9'
                    }
                  }}
                >
                  {card.buttonText}
                </Button>
              </Box>
            </Paper>
          ))}
        </Box>
      </Container>
    </Box>
  );
} 