// Kør dette script for at teste din Supabase connection direkte
// node test-supabase-delete.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Parse .env.local manually
const envPath = '.env.local';
const envVars = {};
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      envVars[key] = value;
    }
  });
}

const SUPABASE_URL = envVars.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = envVars.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Testing Supabase connection...');
console.log('URL:', SUPABASE_URL);
console.log('Service Key (first 6 chars):', SUPABASE_SERVICE_KEY?.slice(0, 6));

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing credentials in .env.local');
  console.error('Found env vars:', Object.keys(envVars));
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testDelete() {
  const chatId = '98d682b3-f5af-4df3-8e7d-4b76f830aab4';
  
  // 1. Hent chatten først
  console.log('\n1️⃣ Fetching chat...');
  const { data: chat, error: fetchError } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .single();
  
  if (fetchError) {
    console.error('❌ Fetch error:', fetchError);
  } else {
    console.log('✅ Chat found:', chat);
  }
  
  // 2. Prøv at slette
  console.log('\n2️⃣ Attempting delete...');
  const { data: deleted, error: deleteError } = await supabase
    .from('chats')
    .delete()
    .eq('id', chatId)
    .select();
  
  if (deleteError) {
    console.error('❌ Delete error:', deleteError);
  } else {
    console.log('✅ Delete result:', deleted);
  }
  
  // 3. Tjek om den stadig findes
  console.log('\n3️⃣ Checking if still exists...');
  const { data: stillThere, error: checkError } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .single();
  
  if (checkError) {
    if (checkError.code === 'PGRST116') {
      console.log('✅ Chat successfully deleted (not found)');
    } else {
      console.error('❌ Check error:', checkError);
    }
  } else {
    console.log('⚠️  Chat STILL EXISTS:', stillThere);
  }
}

testDelete().catch(console.error);

