#!/usr/bin/env node

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🚀 Setting up Supabase database for your project...');
console.log('');

rl.question('Enter your Supabase DATABASE_URL: ', (databaseUrl) => {
  if (!databaseUrl.startsWith('postgresql://')) {
    console.error('❌ Invalid DATABASE_URL. It should start with postgresql://');
    process.exit(1);
  }

  try {
    console.log('📋 Deploying database schema to Supabase...');
    
    // Set the DATABASE_URL and deploy schema
    execSync(`DATABASE_URL="${databaseUrl}" npx prisma db push`, { 
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: databaseUrl }
    });

    console.log('✅ Database schema deployed successfully!');
    console.log('');
    console.log('🎯 Next steps:');
    console.log('1. Update your Vercel environment variables with this DATABASE_URL');
    console.log('2. Redeploy your Vercel app');
    console.log('3. Your app should work perfectly!');
    console.log('');
    console.log('💡 To update Vercel environment variables:');
    console.log('   - Go to your Vercel dashboard');
    console.log('   - Settings → Environment Variables');
    console.log('   - Update DATABASE_URL with your Supabase URL');

  } catch (error) {
    console.error('❌ Error deploying schema:', error.message);
    console.log('');
    console.log('💡 Make sure:');
    console.log('1. Your Supabase project is running');
    console.log('2. The DATABASE_URL is correct');
    console.log('3. You have internet connection');
  } finally {
    rl.close();
  }
}); 