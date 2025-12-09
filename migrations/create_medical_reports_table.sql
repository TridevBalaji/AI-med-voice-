-- Create medical_reports table in Neon database
-- Run this SQL in your Neon database console or via drizzle-kit
-- This matches the schema defined in config/schema.tsx with snake_case column names

CREATE TABLE IF NOT EXISTS medical_reports (
  id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  session_id VARCHAR(255) NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  agent VARCHAR(255) NOT NULL,
  "user" VARCHAR(255) NOT NULL,
  timestamp VARCHAR(255) NOT NULL,
  chief_complaint TEXT NOT NULL,
  summary TEXT NOT NULL,
  symptoms TEXT NOT NULL,
  duration VARCHAR(255) NOT NULL,
  severity VARCHAR(255) NOT NULL,
  medications_mentioned TEXT NOT NULL,
  recommendations TEXT NOT NULL,
  created_on VARCHAR(255) NOT NULL
);

-- Create index on session_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_medical_reports_session_id ON medical_reports(session_id);

-- Create index on created_by for user-specific queries
CREATE INDEX IF NOT EXISTS idx_medical_reports_created_by ON medical_reports(created_by);

