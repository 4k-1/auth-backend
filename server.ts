import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import accountsController from './accounts/accounts.controller';
import errorHandler from './_middleware/error-handler';
import swaggerDocs from './_helpers/swagger'
import './_helpers/db'; // This initializes the database

dotenv.config();

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

// Routes
app.use('/accounts', accountsController);
app.use('/api-docs', swaggerDocs);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString(), env: process.env.NODE_ENV });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Auth System API is running',
    health: '/health',
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Global error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 CORS Origins: ${allowedOrigins.join(', ')}`);
});