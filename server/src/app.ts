import express from 'express';
import cors from 'cors';
import { config } from './config/env';
import { errorHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth';
import { categoriesRouter } from './routes/categories';
import { productsRouter } from './routes/products';
import { searchRouter } from './routes/search';
import { cartRouter } from './routes/cart';
import { ordersRouter } from './routes/orders';
import { adminRouter } from './routes/admin';
import { paymentsRouter } from './routes/payments';
import { contactRouter } from './routes/contact';

export const app = express();

// Middleware
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (
        config.corsOrigins.includes(origin) ||
        config.nodeEnv === 'development' ||
        origin.includes('localhost') ||
        origin.includes('127.0.0.1')
      ) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

// System Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: "Evy's Projects Backend API",
    currency: config.commerce.currency,
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API v1 Routes
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/categories', categoriesRouter);
app.use('/api/v1/products', productsRouter);
app.use('/api/v1/search', searchRouter);
app.use('/api/v1/cart', cartRouter);
app.use('/api/v1/orders', ordersRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/contact', contactRouter);
app.use('/api/v1/admin', adminRouter);

// 404 Catch-all
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

// Centralized Error Handling
app.use(errorHandler);
