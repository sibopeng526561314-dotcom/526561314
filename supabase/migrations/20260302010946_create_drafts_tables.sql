/*
  # Document Draft Management Schema

  1. New Tables
    - `documents`
      - `id` (uuid, primary key)
      - `user_id` (uuid, nullable for now - can be linked to auth later)
      - `file_name` (text)
      - `file_type` (text)
      - `upload_date` (timestamptz)
      - `created_at` (timestamptz)
    
    - `recognized_titles`
      - `id` (uuid, primary key)
      - `document_id` (uuid, foreign key)
      - `title_text` (text)
      - `title_number` (integer)
      - `created_at` (timestamptz)
    
    - `drafts`
      - `id` (uuid, primary key)
      - `title_id` (uuid, foreign key)
      - `content` (text)
      - `mode` (text - 'typing' or 'handwriting')
      - `canvas_data` (text - for handwriting strokes)
      - `width` (integer - custom width in pixels)
      - `height` (integer - custom height in pixels)
      - `updated_at` (timestamptz)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for public access (since no auth is required initially)
*/

CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  file_name text NOT NULL,
  file_type text NOT NULL,
  upload_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recognized_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid REFERENCES documents(id) ON DELETE CASCADE,
  title_text text NOT NULL,
  title_number integer NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title_id uuid REFERENCES recognized_titles(id) ON DELETE CASCADE,
  content text DEFAULT '',
  mode text DEFAULT 'typing',
  canvas_data text,
  width integer DEFAULT 600,
  height integer DEFAULT 300,
  updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognized_titles ENABLE ROW LEVEL SECURITY;
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to documents"
  ON documents FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to documents"
  ON documents FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to documents"
  ON documents FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to documents"
  ON documents FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to recognized_titles"
  ON recognized_titles FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to recognized_titles"
  ON recognized_titles FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to recognized_titles"
  ON recognized_titles FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to recognized_titles"
  ON recognized_titles FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Allow public read access to drafts"
  ON drafts FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Allow public insert to drafts"
  ON drafts FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow public update to drafts"
  ON drafts FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Allow public delete to drafts"
  ON drafts FOR DELETE
  TO anon
  USING (true);