import express from 'express';
import cors from 'cors'; // Import cors
import routes from './routes/index.js';
import { errorConverter, errorHandler } from './middlewares/error.middleware.js';
import { notFound } from './middlewares/notFound.middleware.js';

const app = express();

// CORS configuration
app.use(cors()); // Allow all origins

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ success: true, message: 'SAPRES SARL API Server', version: '1.0.0' });
});

// API routes (versioned)
app.use('/api/v1', routes);

// send back a 404 error for any unknown api request
app.use(notFound);

// convert error to ApiError, if needed
app.use(errorConverter);

// handle error
app.use(errorHandler);

export default app;
