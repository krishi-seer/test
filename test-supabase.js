import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function testConnection() {
  try {
    console.log('Testing Supabase connection...');
    const result = await supabase.from('farmers').select('count').limit(1);
    console.log('Connection successful:', result.error ? 'Error: ' + result.error.message : 'OK');
  } catch (err: any) {
    console.log('Connection failed:', err.message);
  }
}

testConnection();