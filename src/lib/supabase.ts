import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Document {
  id: string;
  user_id: string | null;
  file_name: string;
  file_type: string;
  upload_date: string;
  created_at: string;
}

export interface RecognizedTitle {
  id: string;
  document_id: string;
  title_text: string;
  title_number: number;
  created_at: string;
}

export interface Draft {
  id: string;
  title_id: string;
  content: string;
  mode: 'typing' | 'handwriting';
  canvas_data: string | null;
  width: number;
  height: number;
  updated_at: string;
  created_at: string;
}
