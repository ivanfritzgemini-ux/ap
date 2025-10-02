const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cbqfquqjzmpkqxvzeyow.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNicWZxdXFqem1wa3F4dnpleW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI2NDgzOTAsImV4cCI6MjA0ODIyNDM5MH0.mNrzHufrJ1RkPV5ulWJ0yy3rYXaIf8o4_QFnTIMqINQ';

function createServerClient() {
  return createClient(supabaseUrl, supabaseKey);
}

module.exports = { createServerClient };