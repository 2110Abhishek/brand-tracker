const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Store io instance for use in routes
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/brand-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('MongoDB connection error:', err));

// Import Models (This ensures models are registered before routes)
require('./models/Mention');
require('./models/Brand');
require('./models/Analytics');
require('./models/Dashboard');

// Routes
app.use('/api/mentions', require('./routes/mentions'));
app.use('/api/brands', require('./routes/brands'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/dashboard', require('./routes/dashboard')); // Add dashboard routes

// Debug: Log loaded routes
console.log('Loaded routes:');
console.log('- /api/mentions');
console.log('- /api/brands'); 
console.log('- /api/analytics');
console.log('- /api/dashboard');

// Health check route
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Default route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Brand Mention Tracker API is running!',
    version: '1.0.0',
    endpoints: {
      mentions: '/api/mentions',
      brands: '/api/brands',
      analytics: '/api/analytics',
      dashboard: '/api/dashboard',
      health: '/health'
    }
  });
});

// WebSocket for real-time updates
io.on('connection', (socket) => {
  console.log('Client connected');
  
  // Handle brand subscriptions for real-time updates
  socket.on('subscribe-to-brand', (brand) => {
    socket.join(brand);
    console.log(`Client subscribed to brand: ${brand}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? {} : err.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    availableRoutes: {
      mentions: '/api/mentions',
      brands: '/api/brands',
      analytics: '/api/analytics',
      dashboard: '/api/dashboard'
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}`);
  console.log(`🔍 Health check: http://localhost:${PORT}/health`);
});