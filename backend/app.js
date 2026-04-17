const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const authRoutes = require('./routes/authRoutes');
const securityRoutes = require('./routes/securityRoutes');
const userRoutes = require('./routes/userRoutes');
const { createAlert, getEvents } = require('./controllers/securityController');

const app = express();

const allowedOrigins = [
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (
      allowedOrigins.includes(origin) ||
      origin.endsWith(".vercel.app")
    ) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.options("*", cors());

app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

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
