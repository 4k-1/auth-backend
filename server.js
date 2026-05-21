require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');
const { initializeDatabase } = require('./src/config/database');
const authRoutes = require('./src/routes/authRoutes');
const accountRoutes = require('./src/routes/accountRoutes');

const app = express();
const PORT = process.env.PORT || 4000;

// CORS - Allow multiple origins
const allowedOrigins = [
  'http://localhost:4200',
  'https://auth-frontend-b038.onrender.com',
  'https://auth-backend-6qyk.onrender.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(cookieParser());

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Auth System API Docs',
}));

// Routes
app.use('/accounts', authRoutes);
app.use('/accounts', accountRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Auth System API is running',
    docs: '/api-docs',
    health: '/health',
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error', error: process.env.NODE_ENV === 'development' ? err.message : undefined });
});

async function start() {
  await initializeDatabase();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
    console.log(`🔗 CORS Origins: http://localhost:4200, https://auth-frontend-b038.onrender.com`);
  });
}

start().catch(console.error);