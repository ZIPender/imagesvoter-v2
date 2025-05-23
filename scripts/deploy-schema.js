#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🚀 Deploying database schema to Vercel Postgres...');

try {
  // Check if we're linked to Vercel
  if (!fs.existsSync('.vercel')) {
    console.log('🔗 Linking to Vercel project...');
    execSync('npx vercel link', { stdio: 'inherit' });
  }

  // Pull environment variables
  console.log('📥 Pulling environment variables...');
  execSync('npx vercel env pull .env.production', { stdio: 'inherit' });

  // Deploy schema using production DATABASE_URL
  console.log('📋 Deploying database schema...');
  execSync('npx dotenv -e .env.production -- npx prisma db push --accept-data-loss', { 
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });

  console.log('✅ Database schema deployed successfully!');
  console.log('🎯 You can now use your app at: https://your-domain.vercel.app');

} catch (error) {
  console.error('❌ Error deploying schema:', error.message);
  console.log('\n💡 Alternative methods:');
  console.log('1. Use Vercel dashboard to access your database directly');
  console.log('2. Contact Vercel support for database permissions');
  console.log('3. Use a different PostgreSQL provider with full permissions');
  process.exit(1);
} 