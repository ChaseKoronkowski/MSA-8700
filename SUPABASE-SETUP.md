# Supabase Setup for AI Travel Planner

This document provides instructions for setting up the Supabase database required for the AI Travel Planner application.

## Prerequisites

1. Access to your Supabase project at https://jqhojaznhxopvbnkigzg.supabase.co
2. Administrator privileges to execute SQL queries

## Setup Steps

### 1. Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```
NEXT_PUBLIC_SUPABASE_URL=https://jqhojaznhxopvbnkigzg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SETUP_API_KEY=<your-custom-setup-api-key>
```

Replace `<your-anon-key>` with the anon/public key from your Supabase project settings.
Replace `<your-custom-setup-api-key>` with a secret key of your choice for database setup security.

### 2. Create Database Tables and Functions

1. Log in to your Supabase dashboard: https://supabase.com/dashboard/project/jqhojaznhxopvbnkigzg
2. Navigate to the SQL Editor
3. Execute the following SQL script to create the necessary functions:

```sql
-- Function to create access_codes table if it doesn't exist
CREATE OR REPLACE FUNCTION create_access_codes_table()
RETURNS VOID AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS access_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
END;
$$ LANGUAGE plpgsql;

-- Function to create llm_results table if it doesn't exist
CREATE OR REPLACE FUNCTION create_llm_results_table()
RETURNS VOID AS $$
BEGIN
  CREATE TABLE IF NOT EXISTS llm_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content TEXT NOT NULL,
    type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    user_identifier TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  -- Create index on type for faster filtering
  CREATE INDEX IF NOT EXISTS idx_llm_results_type ON llm_results(type);
  
  -- Create index on user_identifier for faster filtering
  CREATE INDEX IF NOT EXISTS idx_llm_results_user_identifier ON llm_results(user_identifier);
END;
$$ LANGUAGE plpgsql;
```

4. Execute both functions to create the tables:

```sql
SELECT create_access_codes_table();
SELECT create_llm_results_table();
```

### 3. Create Default Access Code

Execute the following SQL to create a default access code:

```sql
INSERT INTO access_codes (code, is_active)
VALUES ('strawberryshortcake2025', true);
```

You can change 'ACCESS2024' to any code of your choice.

### 4. Set Up Row-Level Security (Optional)

For additional security, you can set up Row-Level Security (RLS) policies:

```sql
-- Enable RLS on tables
ALTER TABLE access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_results ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users
CREATE POLICY "Allow read access to authenticated users" 
ON access_codes FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow read/write access to authenticated users" 
ON llm_results FOR ALL TO authenticated USING (true);
```

## Verifying the Setup

After completing the setup, you can verify everything is working correctly by:

1. Running your application locally with `npm run dev`
2. Navigating to the access code page `/access`
3. Entering the default access code you created
4. Generating a travel recommendation and route plan
5. Checking the Supabase database tables to confirm the results are being saved

## Troubleshooting

If you encounter any issues:

1. Check the browser console for error messages
2. Verify that your environment variables are correctly set
3. Make sure the Supabase project URL and anon key are correct
4. Check that the SQL functions were successfully created in Supabase 