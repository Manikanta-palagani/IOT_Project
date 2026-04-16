const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const securityRoutes = require('./routes/securityRoutes');
const userRoutes = require('./routes/userRoutes');
const { createAlert, getEvents } = require('./controllers/securityController');

const app = express();

app.use(cors({
  origin: [
    "https://smarthomesecurity-8x4ub3h3y-manikantas-projects-8b9f4606.vercel.app",
    "http://localhost:5173"
  ],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options('*', cors());

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'smart-home-security-monitoring-system',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/users', userRoutes);
app.post('/api/alerts', createAlert);
app.get('/api/alerts', getEvents);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.statusCode || 500).json({
    message: error.message || 'Internal server error',
  });
});

module.exports = app;
