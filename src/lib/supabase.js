import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://utiymhbqcejvkexmigia.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV0aXltaGJxY2VqdmtleG1pZ2lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgxMTYxMDIsImV4cCI6MjA5MzY5MjEwMn0.SxAQyXebO46AwkOgH8w4f4CGOiOF3B797ip_WyrArik';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
