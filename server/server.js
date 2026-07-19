import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import compression from 'compression';
import router from './router.js';
import sanitizeHtml from 'sanitize-html';

dotenv.config();

// 1. Environment variable validation on startup
const REQUIRED_ENV = ['PORT'];
REQUIRED_ENV.forEach((envVar) => {
  if (!process.env[envVar]) {
    console.error(`FATAL: Environment variable ${envVar} is missing.`);
    process.exit(1);
  }
});

if (!process.env.GEMINI_API_KEY) {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not defined. Falling back to offline local simulation.");
}

const app = express();
app.use(compression());
const PORT = process.env.PORT || 5000;

// 2. In-memory Rate Limiting Middleware
const rateLimitMap = new Map();
const rateLimiter = (limit, windowMs) => {
  return (req, res, next) => {
    const ip = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const now = Date.now();
    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, []);
    }
    const timestamps = rateLimitMap.get(ip).filter(t => now - t < windowMs);
    if (timestamps.length >= limit) {
      console.warn(`Rate limit triggered for IP: ${ip}`);
      return res.status(429).json({ error: 'Too many requests. Please try again later.' });
    }
    timestamps.push(now);
    rateLimitMap.set(ip, timestamps);
    next();
  };
};

// 3. Custom XSS Request Input Sanitizer Middleware using sanitize-html
const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  return sanitizeHtml(str, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard'
  });
};

const sanitizeBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (const key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      } else if (typeof req.body[key] === 'object' && req.body[key] !== null) {
        for (const subKey in req.body[key]) {
          if (typeof req.body[key][subKey] === 'string') {
            req.body[key][subKey] = sanitizeString(req.body[key][subKey]);
          }
        }
      }
    }
  }
  next();
};

// Security and utility middlewares
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://images.unsplash.com", "https://firebasestorage.googleapis.com"],
      connectSrc: [
        "'self'", 
        "https://*.googleapis.com", 
        "https://*.firebaseio.com", 
        "wss://*.firebaseio.com", 
        "https://*.firebase.com", 
        "https://*.firebaseapp.com"
      ],
      frameSrc: ["'self'", "https://*.firebaseapp.com"],
      objectSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
}));

// Strictly allow local frontend origin for CORS compliance
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5000', 'https://arenamind-ai.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());
app.use(sanitizeBody);

// Enforce Rate Limiting specifically on the API router (100 queries per 15 minutes)
app.use('/api', rateLimiter(100, 15 * 60 * 1000), router);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Secure Error Handling middleware (Hiding details in production)
app.use((err, req, res, next) => {
  console.error("Secure Internal Error Logged:", err.message || err);
  const isProd = process.env.NODE_ENV === 'production';
  res.status(500).json({
    error: 'Internal Server Error',
    message: isProd ? 'An unexpected database or systems error occurred.' : (err.message || 'Something went wrong on the server')
  });
});

app.listen(PORT, () => {
  console.log(`ArenaMind AI Enterprise Server running on port ${PORT}`);
});
