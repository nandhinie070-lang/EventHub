const cron = require('node-cron');
const Event = require('../models/Event');

const initCronJobs = () => {
  // 1. Run at minute 0 every hour: Mark past approved events as 'completed'
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      const result = await Event.updateMany(
        {
          status: 'approved',
          endDate: { $lt: now }
        },
        {
          $set: { status: 'completed' }
        }
      );
      if (result.modifiedCount > 0) {
        console.log(`⏰ [CRON JOB]: Marked ${result.modifiedCount} ended events as 'completed'.`);
      }
    } catch (err) {
      console.error('❌ [CRON ERROR] Failed to complete past events:', err.message);
    }
  });

  console.log('✅ Cron scheduler initialized (hourly event lifecycle auto-completion active).');
};

module.exports = {
  initCronJobs
};
