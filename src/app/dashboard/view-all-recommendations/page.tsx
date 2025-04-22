'use client';

import { useState, useEffect } from 'react';
import { Box, Container, Typography, Card, CardContent, Chip, Button, CircularProgress } from '@mui/material';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

// Recommendation type
interface Recommendation {
  id: string;
  content: string;
  type: string;
  metadata: any;
  created_at: string;
  user_identifier?: string;
}

export default function ViewAllRecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const response = await fetch('/api/recommendations');
        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }
        
        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load recommendations. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, []);

  const handleViewRecommendation = (id: string) => {
    router.push(`/dashboard/recommendation-details/${id}`);
  };

  // Extract a snippet from the recommendation content
  const getSnippet = (content: string, maxLength = 150) => {
    if (!content) return '';
    return content.length > maxLength 
      ? content.substring(0, maxLength) + '...' 
      : content;
  };

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
            My Travel Recommendations
          </Typography>
          
          <Typography 
            variant="body1" 
            sx={{ 
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 300,
              maxWidth: '600px'
            }}
          >
            View all your generated travel recommendations. Click on any card to see the detailed recommendations.
          </Typography>
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" my={8}>
            <CircularProgress sx={{ color: '#90caf9' }} />
          </Box>
        ) : error ? (
          <Box 
            sx={{ 
              p: 3, 
              bgcolor: 'rgba(211, 47, 47, 0.2)', 
              color: '#f5f5f5',
              borderRadius: 2,
              my: 2,
              border: '1px solid rgba(211, 47, 47, 0.3)'
            }}
          >
            <Typography>{error}</Typography>
          </Box>
        ) : recommendations.length === 0 ? (
          <Box 
            sx={{ 
              p: 4, 
              bgcolor: '#333333', 
              borderRadius: 2,
              textAlign: 'center',
              my: 4,
              border: '1px solid rgba(255, 255, 255, 0.05)'
            }}
          >
            <Typography variant="h6" gutterBottom color="#f5f5f5">No recommendations found</Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              You haven't generated any travel recommendations yet.
            </Typography>
            <Button 
              variant="outlined" 
              sx={{ 
                mt: 2,
                borderColor: '#90caf9',
                color: '#90caf9',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: 'rgba(144, 202, 249, 0.08)',
                  borderColor: '#90caf9'
                }
              }}
              onClick={() => router.push('/recommendation')}
            >
              Create a Recommendation
            </Button>
          </Box>
        ) : (
          <Box 
            sx={{ 
              display: 'grid', 
              gridTemplateColumns: {
                xs: '1fr',
                md: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)'
              },
              gap: 3,
              mt: 2
            }}
          >
            {recommendations.map((recommendation) => (
              <Card 
                key={recommendation.id}
                sx={{ 
                  height: '100%', 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'all 0.2s ease-in-out',
                  backgroundColor: '#333333',
                  color: 'white',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  borderRadius: 2,
                  border: '1px solid rgba(255,255,255,0.05)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
                    backgroundColor: '#3a3a3a',
                    borderColor: 'rgba(255,255,255,0.1)',
                    cursor: 'pointer'
                  }
                }}
                onClick={() => handleViewRecommendation(recommendation.id)}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Chip 
                      label={`ID: ${recommendation.id.substring(0, 8)}`} 
                      size="small" 
                      sx={{
                        backgroundColor: 'rgba(144, 202, 249, 0.2)',
                        color: '#90caf9',
                        borderColor: 'rgba(144, 202, 249, 0.3)',
                        '& .MuiChip-label': {
                          fontWeight: 400
                        }
                      }}
                    />
                    <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                      {format(new Date(recommendation.created_at), 'MMM d, yyyy')}
                    </Typography>
                  </Box>
                  
                  <Typography variant="subtitle1" sx={{ fontWeight: "500", color: '#f5f5f5' }} gutterBottom>
                    Travel Recommendation
                  </Typography>
                  
                  <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)', mb: 2 }}>
                    {getSnippet(recommendation.content)}
                  </Typography>

                  {recommendation.metadata?.original_prompt && (
                    <Box sx={{ mt: 'auto' }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }} component="div">
                        <strong>Original Prompt:</strong> {getSnippet(recommendation.metadata.original_prompt, 100)}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>
    </Box>
  );
} 