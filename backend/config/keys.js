require('dotenv').config();

module.exports = {
  // Server Configuration
  PORT: process.env.PORT || 5000,  // Changed default from 3000 to 5000 for consistency
  NODE_ENV: process.env.NODE_ENV || 'development',

  // Supabase Configuration
  SUPABASE_URL: process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,

  // Goong API Configuration
  GOONG_API_KEY: process.env.GOONG_API_KEY,
  GOONG_MAPTILES_KEY: process.env.GOONG_MAPTILES_KEY,
};

