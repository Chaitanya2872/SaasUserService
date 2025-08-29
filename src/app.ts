import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import userRoutes from './presentation/routes/userRoutes';
import { errorMiddleware } from './presentation/middleware/errorMiddleware';

const app = express();

// Security middleware
app.use(helmet());
app.use(cors());

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'User Service is running' });
});

// Routes
app.use('/api', userRoutes);

// Error handling
app.use(errorMiddleware);

export default app;