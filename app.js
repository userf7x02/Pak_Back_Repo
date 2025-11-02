const express = require('express');
const app = express();
const path = require("path");
const cors = require("cors");
const mongoose = require('mongoose');

require("dotenv").config();

// ✅ Local + Live CORS
app.use(cors({
  origin: "*",
  credentials: true
}));

// ✅ Manual CORS bhi rakho (backup)
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
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ BASIC ROUTES
app.get('/', (req, res) => {
  res.send('✅ Backend Running Successfully on Vercel!');
});

app.get('/env-check', (req, res) => {
    const envVars = {
        CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
        CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY ? "✅ SET" : "❌ MISSING",
        CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET ? "✅ SET" : "❌ MISSING", 
        MONGODB_URI: process.env.MONGODB_URI ? "✅ SET" : "❌ MISSING",
        NODE_ENV: process.env.NODE_ENV || 'development'
    };
    
    console.log("Environment Check:", envVars);
    res.json(envVars);
});

app.get('/test-simple', async (req, res) => {
    try {
        res.json({ 
          success: true, 
          message: "Server working perfectly", 
          timestamp: new Date(),
          environment: process.env.NODE_ENV || 'development'
        });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
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
// ✅ TEST DATABASE ROUTE
app.get('/test-db', async (req, res) => {
  try {
    const dbStatus = mongoose.connection.readyState;
    const statusMap = {
      0: 'Disconnected',
      1: 'Connected', 
      2: 'Connecting',
      3: 'Disconnecting'
    };
    
    // Test database operation
    let testResult = 'Not tested';
    if (dbStatus === 1) {
      const mongoose = require('mongoose');
      testResult = await mongoose.connection.db.admin().ping();
    }
    
    res.json({
      database: statusMap[dbStatus],
      connectionState: dbStatus,
      mongodbUri: process.env.MONGODB_URI ? '✅ Present' : '❌ Missing',
      databaseTest: testResult,
      timestamp: new Date()
    });
  } catch (error) {
    res.json({
      database: 'Error',
      connectionState: 0,
      mongodbUri: process.env.MONGODB_URI ? '✅ Present' : '❌ Missing',
      databaseTest: error.message,
      timestamp: new Date()
    });
  }
});

// ✅ MULTER SETUP
const multer = require("multer");
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname)
  }
});

const fs = require('fs');
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

const upload = multer({ storage });

// ✅ DATABASE CONNECTION WITH PROPER ERROR HANDLING
const connectDB = async () => {
  try {
    console.log('📍 Connecting to MongoDB...');
    console.log('📍 MongoDB URI Present:', process.env.MONGODB_URI ? '✅ YES' : '❌ NO');
    
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is missing');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    });
    
    console.log('✅ MongoDB Connected Successfully');
    console.log('📍 Host:', mongoose.connection.host);
    console.log('📍 Database:', mongoose.connection.name);
    
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    // Process exit mat karo, server chalne do
  }
};

// Database connect karo
connectDB();
// ✅ IMPORTED ROUTES
const createCategory = require("./routes/category");
const createStatus = require("./routes/status");
const createArea = require("./routes/city_area");
const createCity = require("./routes/city");
const createCountry = require("./routes/country");
const createProvince = require("./routes/province");
const createRole = require("./routes/role");
const createAdvertisement = require("./routes/Advertisment");
const signupROUTER = require("./routes/Signup");
const loginROUTER = require("./routes/Login");
const updateUserRouter = require("./routes/Update");
const createAuth = require("./routes/Forgot");
const createContact = require("./routes/Contact");

app.use("/createCategory", createCategory);
app.use("/createStatus", createStatus);
app.use("/createuser", signupROUTER);
app.use("/createlogin", loginROUTER);
app.use("/createArea", createArea);
app.use("/createCity", createCity);
app.use("/createCountry", createCountry);
app.use("/createProvince", createProvince);
app.use("/createRole", createRole);
app.use("/createAdvertisement", createAdvertisement);
app.use("/createAuth", createAuth);
app.use("/createContact", createContact);
app.use("/createuser", updateUserRouter);

// ✅ FORM ROUTE
app.post("/creatform", upload.single("image"), async (req, res) => {
  try {
    const { Name, Description, EndsOn, Features, Price, StartsOn, CityArea, Category } = req.body;
    const Image = req.file ? req.file.filename : null;

    if (!Name || !Description || !EndsOn || !Features || !Price || !StartsOn || !Image || !CityArea || !Category) {
      return res.status(400).json({ message: "Please fulfill all the required fields." });
    }

    const Advertisement_Model = require("./models/Advertisement");
    const Data = await Advertisement_Model.create({
      Name,
      Description,
      EndsOn,
      Features,
      Price,
      StartsOn,
      CityArea,
      Image,
      Category
    });

    res.status(200).json({
      message: "Advertisement created successfully",
      data: Data,
    });
  } catch (e) {
    console.log("Form Error:", e.message);
    res.status(500).json({ Error: e.message });
  }
});

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

module.exports = app;// FORCE DEPLOYE - CORS FIX
