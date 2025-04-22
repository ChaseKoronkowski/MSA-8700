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