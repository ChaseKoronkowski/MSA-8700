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

export default function ViewAllRecommendationsPage() {
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
              fontWeight: 500,
              py: 1,
              px: 2,
              borderRadius: 2,
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            Create Recommendation
          </Button>
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
                    borderColor: 'rgba(255,255,255,0.1)'
                  },
                  position: 'relative'
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.5)' }}>
                        {format(new Date(recommendation.created_at), 'MMM d, yyyy')}
                      </Typography>
                      <IconButton
                        aria-label="delete recommendation"
                        onClick={(e) => handleDeleteClick(e, recommendation.id)}
                        size="small"
                        sx={{
                          color: 'rgba(255, 255, 255, 0.5)',
                          padding: '4px',
                          '&:hover': {
                            color: '#ff5252',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)'
                          }
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
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
                  
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={isParsing[recommendation.id] ? <CircularProgress size={16} /> : <ParseIcon />}
                      disabled={isParsing[recommendation.id]}
                      onClick={(e) => handleParseData(e, recommendation)}
                      sx={{
                        borderColor: '#90caf9',
                        color: '#90caf9',
                        '&:hover': {
                          backgroundColor: 'rgba(144, 202, 249, 0.08)',
                          borderColor: '#90caf9'
                        },
                        textTransform: 'none'
                      }}
                    >
                      {isParsing[recommendation.id] ? 'Parsing...' : 'Parse Data'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </Container>

      {/* Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleCloseDeleteDialog}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
        PaperProps={{
          sx: {
            backgroundColor: '#333333',
            color: '#f5f5f5'
          }
        }}
      >
        <DialogTitle id="delete-dialog-title">
          Delete Recommendation
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Are you sure you want to delete this recommendation? This action will delete all associated data and cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCloseDeleteDialog} 
            sx={{ 
              color: '#90caf9',
              '&:hover': {
                backgroundColor: 'rgba(144, 202, 249, 0.08)'
              }
            }}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmDelete} 
            color="error" 
            variant="contained"
            disabled={isDeleting}
            startIcon={isDeleting ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbars */}
      <Snackbar 
        open={deleteSuccess} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="success" 
          variant="filled"
        >
          Recommendation successfully deleted
        </Alert>
      </Snackbar>

      <Snackbar 
        open={!!deleteError} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="error" 
          variant="filled"
        >
          {deleteError}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!parseSuccess} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="success" 
          variant="filled"
        >
          {parseSuccess}
        </Alert>
      </Snackbar>
      
      <Snackbar 
        open={!!parseError} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity="error" 
          variant="filled"
        >
          {parseError}
        </Alert>
      </Snackbar>
    </Box>
  );
} 