const dns = require('dns');

// Fix Node.js DNS resolution for MongoDB Atlas
dns.setServers(['8.8.8.8', '1.1.1.1']);
const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    // Run seed on first start if DB is empty
    const User = require('./models/User');
    const count = await User.countDocuments();
    if (count === 0) {
      console.log('🌱 Empty database detected. Running seed script...');
      const { seedData } = require('./config/seed');
      await seedData(false);
    }

    app.listen(PORT, () => {
      console.log(`🚀 Food Safety Portal API running on port ${PORT}`);
      console.log(`📍 http://localhost:${PORT}`);
      console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
