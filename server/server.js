const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config();

// Connect to Database
connectDB();

const app = express();

// Middlewares
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'EventHub API is running',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/events', require('./routes/eventRoutes'));
app.use('/api/registrations', require('./routes/registrationRoutes'));
app.use('/api/certificates', require('./routes/certificateRoutes'));
app.use('/api/feedback', require('./routes/feedbackRoutes'));
app.use('/api/food-coupons', require('./routes/foodCouponRoutes'));
app.use('/api/event-updates', require('./routes/eventUpdateRoutes'));
app.use('/api/issues', require('./routes/issueRoutes'));
app.use('/api/event-templates', require('./routes/eventTemplateRoutes'));
app.use('/api/analytics', require('./routes/analyticsRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// Scheduled Background Cron Jobs
const { initCronJobs } = require('./jobs');
initCronJobs();

// 404 handler for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.originalUrl}`
  });
});

// Centralized error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
