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

// ✅ BASIC ROUTES
app.get('/', (req, res) => {
  res.send('🚀 Portfolio Backend - Pak Classified - Running Successfully!');
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
        
        res.json({
            server: 'Running ✅',
            database: status[dbStatus],
            databaseHost: mongoose.connection.host || 'Not connected',
            databaseName: mongoose.connection.name || 'Not connected',
            timestamp: new Date()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ✅ DATABASE CONNECTION - FIXED FOR LATEST MONGODB
const connectDB = async () => {
  try {
    console.log('🚀 INITIATING MONGODB CONNECTION...');
    
    if (!process.env.MONGODB_URI) {
      console.log('❌ MONGODB_URI NOT FOUND');
      return;
    }

    console.log('📍 MONGODB_URI FOUND, CONNECTING...');

    // ✅ UPDATED OPTIONS - REMOVED DEPRECATED SETTINGS
    const options = {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      retryWrites: true,
      retryReads: true
    };

    await mongoose.connect(process.env.MONGODB_URI, options);
    
    console.log('✅ MONGODB CONNECTED SUCCESSFULLY!');
    console.log('🏠 Host:', mongoose.connection.host);
    console.log('🗃️ Database:', mongoose.connection.name);
    console.log('📊 Ready State:', mongoose.connection.readyState);
    
  } catch (error) {
    console.error('💥 MONGODB CONNECTION FAILED:', error.message);
    
    // Retry connection after 5 seconds
    setTimeout(() => {
      console.log('🔄 RETRYING MONGODB CONNECTION...');
      connectDB();
    }, 5000);
  }
};

// Database connect karo
connectDB();

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
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3300;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));

module.exports = app;