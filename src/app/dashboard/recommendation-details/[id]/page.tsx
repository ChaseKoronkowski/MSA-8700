'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  CircularProgress, 
  Button, 
  Chip, 
  List, 
  ListItem, 
  ListItemText, 
  Divider, 
  Card,
  CardContent,
  IconButton,
  Grid
} from '@mui/material';
import { format } from 'date-fns';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { parseRecommendation, Destination } from '@/utils/parseRecommendation';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`destination-tabpanel-${index}`}
      aria-labelledby={`destination-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function RecommendationDetailsPage({ params }: { params: { id: string } }) {
  const [recommendation, setRecommendation] = useState<any>(null);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const router = useRouter();

  useEffect(() => {
    async function fetchRecommendation() {
      if (!params.id) return;
      
      try {
        const response = await fetch(`/api/recommendations?id=${params.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch recommendation');
        }
        
        const data = await response.json();
        if (!data.recommendations || data.recommendations.length === 0) {
          throw new Error('Recommendation not found');
        }
        
        const recommendation = data.recommendations[0];
        setRecommendation(recommendation);
        
        // Parse the recommendation content into structured destinations
        if (recommendation.content) {
          const parsedDestinations = parseRecommendation(recommendation.content);
          setDestinations(parsedDestinations);
        }
      } catch (err) {
        console.error('Error fetching recommendation:', err);
        setError('Failed to load recommendation. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendation();
  }, [params.id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    router.push('/dashboard/view-all-recommendations');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !recommendation) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={handleBack}
          sx={{ mb: 2 }}
        >
          Back to Recommendations
        </Button>
        <Paper sx={{ p: 4, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="h5" component="h1" gutterBottom>
            Error Loading Recommendation
          </Typography>
          <Typography>
            {error || 'Recommendation not found. It may have been deleted.'}
          </Typography>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box display="flex" alignItems="center" mb={4}>
        <IconButton onClick={handleBack} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Travel Recommendation
        </Typography>
      </Box>
      
      <Paper sx={{ mb: 4, p: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Chip 
            label={`ID: ${recommendation.id.substring(0, 8)}`} 
            size="small" 
            color="primary"
          />
          <Typography variant="body2" color="text.secondary">
            Created: {format(new Date(recommendation.created_at), 'MMM d, yyyy, h:mm a')}
          </Typography>
        </Box>
        
        {recommendation.metadata?.original_prompt && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Original Prompt:
            </Typography>
            <Typography variant="body2">
              {recommendation.metadata.original_prompt}
            </Typography>
          </Box>
        )}
      </Paper>

      {destinations.length > 0 ? (
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              variant="scrollable"
              scrollButtons="auto"
              allowScrollButtonsMobile
            >
              {destinations.map((destination, index) => (
                <Tab label={destination.name} id={`destination-tab-${index}`} key={index} />
              ))}
            </Tabs>
          </Box>
          
          {destinations.map((destination, index) => (
            <TabPanel value={tabValue} index={index} key={index}>
              <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                {destination.name}
              </Typography>
              
              <Typography paragraph>{destination.description}</Typography>
              
              <Paper sx={{ p: 2, mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Why This Fits Your Preferences
                </Typography>
                <Typography paragraph>{destination.whyItFits}</Typography>
              </Paper>
              
              <Box mt={4}>
                <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom>
                  Places to Visit
                </Typography>
                <List>
                  {destination.placesToVisit.map((place, i) => (
                    <Box key={i}>
                      <ListItem>
                        <ListItemText primary={place} />
                      </ListItem>
                      {i < destination.placesToVisit.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </Box>
              
              <Box mt={4}>
                <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom>
                  Restaurants You Should Try
                </Typography>
                <List>
                  {destination.restaurants.map((restaurant, i) => (
                    <Box key={i}>
                      <ListItem>
                        <ListItemText primary={restaurant} />
                      </ListItem>
                      {i < destination.restaurants.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </Box>
              
              <Box mt={4}>
                <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom>
                  Activities for Your Trip
                </Typography>
                <List>
                  {destination.activities.map((activity, i) => (
                    <Box key={i}>
                      <ListItem>
                        <ListItemText primary={activity} />
                      </ListItem>
                      {i < destination.activities.length - 1 && <Divider />}
                    </Box>
                  ))}
                </List>
              </Box>
              
              <Box mt={4}>
                <Typography variant="h6" component="h3" fontWeight="bold" gutterBottom>
                  Accommodation Recommendations
                </Typography>
                <Grid container spacing={2}>
                  {destination.accommodations.map((accommodation, i) => (
                    <Grid item xs={12} md={6} lg={4} key={i}>
                      <Card>
                        <CardContent>
                          <Typography variant="subtitle1" component="div" fontWeight="medium">
                            {accommodation}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </TabPanel>
          ))}
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No destination details found
          </Typography>
          <Typography paragraph color="text.secondary">
            Unable to parse destination details from this recommendation.
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', textAlign: 'left', p: 2 }}>
            {recommendation.content}
          </Typography>
        </Paper>
      )}
    </Container>
  );
} 