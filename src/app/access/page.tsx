'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccessCode } from '@/context/AccessCodeContext';
import { 
  Box, 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Container, 
  Alert, 
  Collapse, 
  IconButton, 
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export default function AccessCodePage() {
  const [code, setCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const { verifyAccessCode, error, isAuthenticated } = useAccessCode();
  const router = useRouter();

  useEffect(() => {
    // If already authenticated, redirect to home
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    // Show alert when there's an error
    if (error) {
      setShowAlert(true);
    }
  }, [error]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsSubmitting(true);
    try {
      const success = await verifyAccessCode(code);
      if (success) {
        router.push('/');
      }
    } catch (err) {
      console.error('Error during access code verification:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundImage: 'linear-gradient(to right bottom, #0f172a, #1e293b)',
        p: 3,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 2,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Typography variant="h4" component="h1" textAlign="center" fontWeight="bold" gutterBottom>
            Enter Access Code
          </Typography>
          
          <Typography variant="body1" textAlign="center" color="text.secondary" mb={4}>
            Please enter your access code to continue to the AI Travel Planner
          </Typography>

          <Collapse in={showAlert && !!error}>
            <Alert 
              severity="error"
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => setShowAlert(false)}
                >
                  <CloseIcon fontSize="inherit" />
                </IconButton>
              }
              sx={{ mb: 3 }}
            >
              {error}
            </Alert>
          </Collapse>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Access Code"
              variant="outlined"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              error={!!error && showAlert}
              disabled={isSubmitting}
              autoComplete="off"
              sx={{ mb: 3 }}
            />

            <Button 
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              disabled={isSubmitting || !code.trim()}
              sx={{ 
                py: 1.5,
                backgroundColor: '#3b82f6',
                '&:hover': {
                  backgroundColor: '#2563eb',
                } 
              }}
              startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {isSubmitting ? 'Verifying...' : 'Access App'}
            </Button>

            
          </form>
        </Paper>
      </Container>
    </Box>
  );
} 