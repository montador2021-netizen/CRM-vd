import { createClient } from '@supabase/supabase-js';

// Hardcoded para garantir funcionamento imediato no ambiente de preview
const supabaseUrl = 'https://zopnpcrbjxzxiyaletsi.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpvcG5wY3Jianh6eGl5YWxldHNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMzg0MTgsImV4cCI6MjA5MTcxNDQxOH0.6WX9TMlqJjIplt__dKoBtb9_ZT2Xanywcjv96FONkAg';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
