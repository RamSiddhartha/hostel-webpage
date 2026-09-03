import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://bbgcltyuffpcikywmovd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJiZ2NsdHl1ZmZwY2lreXdtb3ZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ0NDM4NzQsImV4cCI6MjA5MDAxOTg3NH0.IkWn5MgvA8ct7Bjfiu9dGg573GrTkRNjjVTbRdulJUM';
export const supabase = createClient(supabaseUrl, supabaseKey);