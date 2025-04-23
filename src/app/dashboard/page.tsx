'use client';

import { useState, useEffect } from 'react';
import { Box, Container, Typography, Card, CardContent, Chip, Button, CircularProgress, IconButton, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Snackbar, Alert } from '@mui/material';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import ParseIcon from '@mui/icons-material/AutoAwesome';

// Recommendation type
interface Recommendation {
  id: string;
  content: string;
  type: string;
  metadata: any;
  created_at: string;
  user_identifier?: string;
}

export default function DashboardPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recommendationToDelete, setRecommendationToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isParsing, setIsParsing] = useState<{[key: string]: boolean}>({});
  const [parseSuccess, setParseSuccess] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchRecommendations();
  }, []);

  async function fetchRecommendations() {
    try {
      setLoading(true);
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

  const handleViewRecommendation = (id: string) => {
    router.push(`/dashboard/recommendation-details/${id}`);
  };

  const handleDeleteClick = (event: React.MouseEvent<HTMLButtonElement>, id: string) => {
    event.stopPropagation(); // Prevent card click from triggering
    setRecommendationToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setRecommendationToDelete(null);
  };

  const handleConfirmDelete = async () => {
    if (!recommendationToDelete) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/recommendations?id=${recommendationToDelete}`, {
        method: 'DELETE',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        const errorMessage = data.error || 'Failed to delete recommendation';
        console.error('Error response:', data);
        throw new Error(errorMessage);
      }
      
      // Remove the deleted recommendation from state
      setRecommendations(recommendations.filter(rec => rec.id !== recommendationToDelete));
      setDeleteSuccess(true);
    } catch (err: any) {
      console.error('Error deleting recommendation:', err);
      setDeleteError(err.message || 'Failed to delete recommendation. Please try again.');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setRecommendationToDelete(null);
    }
  };

  const handleParseData = async (event: React.MouseEvent<HTMLButtonElement>, recommendation: Recommendation) => {
    event.stopPropagation(); // Prevent card click from triggering
    
    // Update parsing state for this specific recommendation
    setIsParsing(prev => ({ ...prev, [recommendation.id]: true }));
    
    try {
      console.log(`Parsing recommendation ${recommendation.id}`);
      
      const response = await fetch('/api/parse-recommendation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: recommendation.id,
          content: recommendation.content
        }),
      });
      
      let data;
      try {
        data = await response.json();
      } catch (err) {
        console.error('Failed to parse response as JSON');
        throw new Error('Invalid response from server, expected JSON');
      }
      
      if (!response.ok) {
        const errorMessage = data.error || `Failed to parse recommendation (${response.status})`;
        console.error('Error response:', data);
        throw new Error(errorMessage);
      }
      
      console.log('Parse successful:', data);
      setParseSuccess(`Successfully parsed and saved data for recommendation ${recommendation.id.substring(0, 8)}`);
      
      // Update the recommendations list to reflect changes
      fetchRecommendations();
    } catch (err: any) {
      console.error('Error parsing recommendation:', err);
      setParseError(err.message || 'Failed to parse recommendation. Please try again.');
    } finally {
      setIsParsing(prev => ({ ...prev, [recommendation.id]: false }));
    }
  };

  const handleCloseSnackbar = () => {
    setDeleteSuccess(false);
    setDeleteError(null);
    setParseSuccess(null);
    setParseError(null);
  };

  // Extract a snippet from the recommendation content
  const getSnippet = (content: string, maxLength = 150) => {
    if (!content) return '';
    
    // Find the first destination name (typically starts with "1. ")
    const destinationMatch = content.match(/\d+\.\s+([\w\s,]+)/);
    let destinationName = '';
    if (destinationMatch && destinationMatch[1]) {
      destinationName = destinationMatch[1].trim();
    }
    
    // Count the number of destinations
    const destinationCount = (content.match(/^\d+\.\s+/gm) || []).length;
    
    // Create a more informative snippet
    let snippet = '';
    if (destinationName) {
      snippet = `${destinationCount} destination${destinationCount > 1 ? 's' : ''} including ${destinationName}`;
      
      // If we can find additional destinations, add them
      if (destinationCount > 1) {
        const additionalDestinations = content.match(/^\d+\.\s+([\w\s,]+)/gm);
        if (additionalDestinations && additionalDestinations.length > 1) {
          // Get the second destination
          const secondDestMatch = additionalDestinations[1].match(/^\d+\.\s+([\w\s,]+)/);
          if (secondDestMatch && secondDestMatch[1]) {
            snippet += ` and ${secondDestMatch[1].trim()}`;
            
            // If there are more than two, add "and more"
            if (destinationCount > 2) {
              snippet += ` and more`;
            }
          }
        }
      }
      
      return snippet;
    }
    
    // Fall back to the original function behavior if we couldn't parse destinations
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
        <Box sx={{ 
          mb: 6, 
          pl: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <Box>
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
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => router.push('/recommendation')}
            sx={{
              backgroundColor: '#90caf9',
              color: '#000',
              '&:hover': {
                backgroundColor: '#6ba8de',
              },
              textTransform: 'none',
              px: 3,
              py: 1
            }}
          >
            Create Recommendation
          </Button>
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress sx={{ color: '#90caf9' }} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 4 }}>{error}</Alert>
        ) : recommendations.length === 0 ? (
          <Card 
            sx={{ 
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              p: 5,
              backgroundColor: '#333333',
              border: '1px solid rgba(255,255,255,0.05)',
              color: 'white',
              textAlign: 'center'
            }}
          >
            <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
              No recommendations found
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              You haven't generated any travel recommendations yet.
            </Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() => router.push('/recommendation')}
              sx={{ 
                borderColor: '#90caf9',
                color: '#90caf9',
                '&:hover': {
                  backgroundColor: 'rgba(144, 202, 249, 0.08)',
                  borderColor: '#90caf9'
                }
              }}
            >
              Create a Recommendation
            </Button>
          </Card>
        ) : (
          <Box 
            sx={{ 
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                lg: 'repeat(3, 1fr)'
              },
              gap: 3
            }}
          >
            {recommendations.map((recommendation) => (
              <Card 
                key={recommendation.id}
                onClick={() => handleViewRecommendation(recommendation.id)}
                sx={{
                  backgroundColor: '#333333',
                  color: 'white',
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  border: '1px solid rgba(255,255,255,0.05)',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 6px 12px rgba(0,0,0,0.15)',
                    backgroundColor: '#3a3a3a',
                    borderColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                <CardContent sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                    <Chip 
                      label="Travel Recommendation" 
                      size="small" 
                      sx={{ 
                        backgroundColor: 'rgba(144, 202, 249, 0.15)',
                        color: '#90caf9',
                        fontWeight: 500
                      }}
                    />
                    
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      {!recommendation.metadata?.parsed_by_ai && (
                        <IconButton 
                          size="small"
                          onClick={(e) => handleParseData(e, recommendation)}
                          disabled={isParsing[recommendation.id]}
                          sx={{ 
                            color: '#90caf9',
                            backgroundColor: 'rgba(144, 202, 249, 0.1)',
                            '&:hover': {
                              backgroundColor: 'rgba(144, 202, 249, 0.2)'
                            }
                          }}
                        >
                          {isParsing[recommendation.id] ? (
                            <CircularProgress size={16} sx={{ color: '#90caf9' }} />
                          ) : (
                            <ParseIcon fontSize="small" />
                          )}
                        </IconButton>
                      )}
                      
                      <IconButton 
                        size="small"
                        onClick={(e) => handleDeleteClick(e, recommendation.id)}
                        sx={{ 
                          color: '#ff6b6b',
                          backgroundColor: 'rgba(255, 107, 107, 0.1)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 107, 107, 0.2)'
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Box sx={{ mb: 'auto' }}>
                    <Typography variant="h6" sx={{ mb: 2, fontWeight: 500 }}>
                      {recommendation.metadata?.title || 'Travel Recommendation'}
                    </Typography>
                    
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        mb: 2,
                        color: 'rgba(255, 255, 255, 0.7)',
                        minHeight: '50px'
                      }}
                    >
                      {getSnippet(recommendation.content)}
                    </Typography>
                  </Box>
                  
                  <Box 
                    sx={{ 
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      pt: 2, 
                      borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                      mt: 2
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'rgba(255, 255, 255, 0.5)',
                        fontSize: '0.75rem'
                      }}
                    >
                      Created: {format(new Date(recommendation.created_at), 'MMM d, yyyy')}
                    </Typography>
                    
                    {recommendation.metadata?.parsed_by_ai && (
                      <Chip 
                        label="AI Parsed" 
                        size="small" 
                        sx={{ 
                          backgroundColor: 'rgba(104, 204, 144, 0.15)',
                          color: '#68cc90',
                          fontWeight: 500,
                          height: '20px',
                          fontSize: '0.7rem'
                        }}
                      />
                    )}
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        PaperProps={{
          sx: {
            backgroundColor: '#333333',
            color: 'white',
            boxShadow: '0 8px 16px rgba(0, 0, 0, 0.4)',
          }
        }}
      >
        <DialogTitle sx={{ color: '#f5f5f5' }}>Delete Recommendation</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Are you sure you want to delete this recommendation? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={handleCloseDeleteDialog} 
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} color="error" /> : null}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar notifications */}
      <Snackbar 
        open={deleteSuccess} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          Recommendation deleted successfully
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!deleteError} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {deleteError}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!parseSuccess} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="success" sx={{ width: '100%' }}>
          {parseSuccess}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!parseError} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: '100%' }}>
          {parseError}
        </Alert>
      </Snackbar>
    </Box>
  );
} 