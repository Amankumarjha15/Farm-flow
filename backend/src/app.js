const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const produceRoutes = require('./routes/produceRoutes');
const bidRoutes = require('./routes/bidRoutes');
const orderRoutes = require('./routes/orderRoutes');
const { router: paymentRoutes, stripeWebhook } = require('./routes/paymentRoutes');
const logisticsRoutes = require('./routes/logisticsRoutes');
const payoutRoutes = require('./routes/payoutRoutes');
const disputeRoutes = require('./routes/disputeRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');
const { errorHandler, notFound } = require('./middlewares/errorHandler');

const app = express();

// Security & parsing middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);

// Stripe webhook needs the RAW request body to verify its signature, so this route
// is registered before express.json() parses the body into an object.
app.post('/api/v1/payments/stripe/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());
app.use(mongoSanitize());

if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Global rate limiter (auth routes have their own tighter limiter)
const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', globalLimiter);

app.get('/api/v1/health', (req, res) => {
  res.json({ success: true, message: 'Farm Flow API is running', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/produce', produceRoutes);
app.use('/api/v1/bids', bidRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/logistics', logisticsRoutes);
app.use('/api/v1/payouts', payoutRoutes);
app.use('/api/v1/disputes', disputeRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/public', publicRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
