const express = require('express');
const app = express();
const path = require("path");
const mongoose = require('mongoose');

require("dotenv").config();

// ✅ Simple CORS - Portfolio ke liye enough
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// ✅ MIDDLEWARES
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ✅ DATABASE CONNECTION - OPTIMIZED FOR VERCEL SERVERLESS
const connectDB = async () => {
  try {
    // Check if already connected
    if (mongoose.connection.readyState === 1) {
      console.log('✅ MongoDB already connected');
      return mongoose.connection;
    }

    console.log('🚀 INITIATING MONGODB CONNECTION FOR VERCEL...');
    
    if (!process.env.MONGODB_URI) {
      console.log('❌ MONGODB_URI NOT FOUND');
      return;
    }

    // ✅ VERCEL OPTIMIZED SETTINGS
    const options = {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 15000,
      maxPoolSize: 5,
      minPoolSize: 1,
      retryWrites: true,
      retryReads: true,
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log('✅ MONGODB CONNECTED SUCCESSFULLY ON VERCEL!');
    console.log('🏠 Host:', mongoose.connection.host);
    console.log('🗃️ Database:', mongoose.connection.name);
    
    return mongoose.connection;
  } catch (error) {
    console.error('💥 MONGODB CONNECTION FAILED ON VERCEL:', error.message);
    return null;
  }
};

// Connect on server start
connectDB();

// ✅ COLD START HANDLER - Reconnect on every request
app.use(async (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.log('🔄 Cold start detected, reconnecting to MongoDB...');
    await connectDB();
  }
  next();
});

// ✅ BASIC ROUTES
app.get('/', (req, res) => {
  res.send('🚀 Portfolio Backend - Pak Classified - Running Successfully on Vercel!');
});

app.get('/env-check', (req, res) => {
  const envVars = {
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? "✅ SET" : "❌ MISSING",
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? "✅ SET" : "❌ MISSING", 
    MONGODB_URI: process.env.MONGODB_URI ? "✅ SET" : "❌ MISSING",
    NODE_ENV: process.env.NODE_ENV || 'development'
  };
  res.json(envVars);
});

app.get('/health', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const status = {
      0: 'Disconnected',
      1: 'Connected', 
      2: 'Connecting',
      3: 'Disconnecting'
    };
    
    // Force actual connection test
    let isActuallyConnected = false;
    let pingResult = 'Not tested';
    
    if (dbStatus === 1) {
      try {
        pingResult = await mongoose.connection.db.admin().ping();
        isActuallyConnected = true;
      } catch (pingError) {
        isActuallyConnected = false;
        pingResult = `Ping failed: ${pingError.message}`;
      }
    }
    
    res.json({
      server: 'Running ✅',
      database: isActuallyConnected ? 'Connected ✅' : status[dbStatus],
      databaseHost: mongoose.connection.host || 'Not connected',
      databaseName: mongoose.connection.name || 'Not connected',
      readyState: dbStatus,
      pingTest: pingResult,
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ✅ DEMO ROUTE FOR PORTFOLIO
app.get('/demo-data', (req, res) => {
  res.json({
    message: "🚀 Pak Classified - Full Stack MERN Application",
    features: [
      "User Authentication & Authorization",
      "Advertisement CRUD Operations", 
      "Image Upload with Cloudinary",
      "Category & Location Management",
      "Advanced Search & Filters",
      "Responsive React Frontend",
      "Node.js + Express Backend",
      "MongoDB Database",
      "JWT Token Security"
    ],
    status: "Backend API Fully Operational",
    database: mongoose.connection.readyState === 1 ? "Connected ✅" : "Connecting...",
    timestamp: new Date()
  });
});

// ✅ MONGODB EVENT LISTENERS
mongoose.connection.on('connected', () => {
  console.log('🎯 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.log('❌ Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('⚠️ Mongoose disconnected from MongoDB');
});

// ✅ ROUTES
const createCategory = require("./routes/category");
const createArea = require("./routes/city_area");
const createAdvertisement = require("./routes/Advertisment");
const signupROUTER = require("./routes/Signup");
const loginROUTER = require("./routes/Login");

app.use("/createCategory", createCategory);
app.use("/createArea", createArea);
app.use("/createAdvertisement", createAdvertisement);
app.use("/createuser", signupROUTER);
app.use("/createlogin", loginROUTER);

// ✅ ERROR HANDLERS
app.use((err, req, res, next) => {
  console.error('💥 Server Error:', err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3300;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;