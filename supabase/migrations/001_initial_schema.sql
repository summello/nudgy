-- Invoice Nudge Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE invoice_status AS ENUM ('processing', 'needs_review', 'overdue', 'paid');
CREATE TYPE reminder_tone AS ENUM ('friendly', 'firm', 'final_notice');
CREATE TYPE payment_kind AS ENUM ('upi', 'payment_url');
CREATE TYPE export_action AS ENUM ('email_copied', 'whatsapp_copied', 'whatsapp_opened');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  business_name TEXT,
  default_signoff TEXT,
  locale TEXT DEFAULT 'en-IN',
  timezone TEXT DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoice files table
CREATE TABLE invoice_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  object_path TEXT NOT NULL,
  sha256_hash TEXT NOT NULL,
  status TEXT DEFAULT 'uploaded', -- uploaded, processing, extracted, failed
  extraction_method TEXT, -- pdf_text, image_ocr, pdf_ocr_failed, failed
  extracted_text TEXT,
  extracted_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invoices table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  contact_name TEXT,
  contact_phone_e164 TEXT,
  invoice_number TEXT,
  amount_minor BIGINT NOT NULL CHECK (amount_minor > 0),
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  issue_date DATE,
  due_date DATE NOT NULL,
  status invoice_status NOT NULL DEFAULT 'needs_review',
  source_object_path TEXT,
  source_sha256 TEXT,
  extraction_method TEXT,
  extraction_confidence JSONB,
  confirmed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment methods table
CREATE TABLE payment_methods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind payment_kind NOT NULL,
  value_encrypted TEXT NOT NULL, -- In production, use proper encryption
  label TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminders table
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version INTEGER NOT NULL DEFAULT 1,
  tone reminder_tone NOT NULL,
  email_subject TEXT NOT NULL,
  email_body TEXT NOT NULL,
  whatsapp_body TEXT NOT NULL,
  context JSONB NOT NULL DEFAULT '{}',
  generation_model TEXT,
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  validation_status TEXT NOT NULL DEFAULT 'pending', -- pending, valid, invalid
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminder exports table
CREATE TABLE reminder_exports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reminder_id UUID NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action export_action NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_invoice_files_owner ON invoice_files(owner_id);
CREATE INDEX idx_invoice_files_hash ON invoice_files(owner_id, sha256_hash);
CREATE INDEX idx_invoices_owner ON invoices(owner_id);
CREATE INDEX idx_invoices_status ON invoices(owner_id, status);
CREATE INDEX idx_invoices_due_date ON invoices(owner_id, due_date);
CREATE INDEX idx_payment_methods_owner ON payment_methods(owner_id);
CREATE INDEX idx_reminders_invoice ON reminders(invoice_id);
CREATE INDEX idx_reminders_owner ON reminders(owner_id);
CREATE INDEX idx_reminder_exports_reminder ON reminder_exports(reminder_id);
CREATE INDEX idx_reminder_exports_owner ON reminder_exports(owner_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminder_exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for invoice_files
CREATE POLICY "Users can view own files" ON invoice_files
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own files" ON invoice_files
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own files" ON invoice_files
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own files" ON invoice_files
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for invoices
CREATE POLICY "Users can view own invoices" ON invoices
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own invoices" ON invoices
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own invoices" ON invoices
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own invoices" ON invoices
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for payment_methods
CREATE POLICY "Users can view own payment methods" ON payment_methods
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own payment methods" ON payment_methods
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own payment methods" ON payment_methods
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own payment methods" ON payment_methods
  FOR DELETE USING (auth.uid() = owner_id);

-- RLS Policies for reminders
CREATE POLICY "Users can view own reminders" ON reminders
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own reminders" ON reminders
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own reminders" ON reminders
  FOR UPDATE USING (auth.uid() = owner_id);

-- RLS Policies for reminder_exports
CREATE POLICY "Users can view own exports" ON reminder_exports
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "Users can insert own exports" ON reminder_exports
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_files_updated_at BEFORE UPDATE ON invoice_files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payment_methods_updated_at BEFORE UPDATE ON payment_methods
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reminders_updated_at BEFORE UPDATE ON reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for invoice files
-- Run this in Supabase Storage UI or via API:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('invoice-files', 'invoice-files', FALSE);

-- Storage policies (run after bucket creation)
-- CREATE POLICY "Users can upload own files" ON storage.objects
--   FOR INSERT WITH CHECK (bucket_id = 'invoice-files' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can view own files" ON storage.objects
--   FOR SELECT USING (bucket_id = 'invoice-files' AND auth.uid()::text = (storage.foldername(name))[1]);
-- CREATE POLICY "Users can delete own files" ON storage.objects
--   FOR DELETE USING (bucket_id = 'invoice-files' AND auth.uid()::text = (storage.foldername(name))[1]);