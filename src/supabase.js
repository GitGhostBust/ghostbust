import { createClient } from '@supabase/supabase-js' 
const SUPABASE_URL = 'https://awhqwqhntgxjvvawzkog.supabase.co' 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3aHF3cWhudGd4anZ2YXd6a29nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5OTQ0NTgsImV4cCI6MjA4OTU3MDQ1OH0.qJFtHMmhPjrYWXEDIO2LPcEBNiYLDX_nv7QPuRfI1Tc' 
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
