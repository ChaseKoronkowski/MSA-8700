// Test script for recommendation flow
require('dotenv').config(); // Load environment variables from .env file if present

// Set Supabase keys if not already set
process.env.NEXT_PUBLIC_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-supabase-anon-key';

// Log what we're using
console.log('Using Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Using Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '[REDACTED]' : 'Not set');

// Require the actual test script
try {
  require('./src/scripts/test-recommendation-flow.js');
} catch (error) {
  console.error('Error running test-recommendation-flow.js:', error.message);
  process.exit(1);
} 