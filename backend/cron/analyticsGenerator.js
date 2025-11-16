const cron = require('node-cron');
const Analytics = require('../models/Analytics');
const Mention = require('../models/Mention');
const Brand = require('../models/Brand');

// Run daily at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('Starting daily analytics generation...');
  
  try {
    const brands = await Brand.find({ isActive: true });
    
    for (const brand of brands) {
      console.log(`Generating analytics for ${brand.name}...`);
      
      // Call the analytics generation endpoint
      const response = await fetch(`http://localhost:${process.env.PORT || 5000}/api/analytics/generate-daily`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ brand: brand.name })
      });
      
      if (response.ok) {
        console.log(`Analytics generated for ${brand.name}`);
      } else {
        console.error(`Failed to generate analytics for ${brand.name}`);
      }
    }
    
    console.log('Daily analytics generation completed');
  } catch (error) {
    console.error('Error in analytics generation cron job:', error);
  }
});

module.exports = cron;