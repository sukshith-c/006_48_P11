const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);

const dotenv = require('dotenv');
dotenv.config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Handler = require('../models/Handler');
const Zone = require('../models/Zone');
const ClassificationRule = require('../models/ClassificationRule');

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('MongoDB connected for seeding...');
};

const seedData = async (shouldDisconnect = true) => {
  try {
    await connectDB();

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Handler.deleteMany({}),
      Zone.deleteMany({}),
      ClassificationRule.deleteMany({})
    ]);

    console.log('🗑️  Cleared existing data');

    // ── Create Users ──
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@foodsafety.gov.in',
      password: 'Admin@123',
      fullName: 'District Officer Kumar',
      role: 'admin'
    });

    const inspectorUser = await User.create({
      username: 'inspector1',
      email: 'inspector@foodsafety.gov.in',
      password: 'Inspector@123',
      fullName: 'Rajesh Sharma',
      role: 'inspector'
    });

    // Handler users (6 primary + 6 deputy = 12 handler users)
    const handlerUsersData = [
      { username: 'handler_z1_primary', email: 'h1p@foodsafety.gov.in', fullName: 'Amit Patel', password: 'Handler@123' },
      { username: 'handler_z1_deputy',  email: 'h1d@foodsafety.gov.in', fullName: 'Priya Singh', password: 'Handler@123' },
      { username: 'handler_z2_primary', email: 'h2p@foodsafety.gov.in', fullName: 'Suresh Kumar', password: 'Handler@123' },
      { username: 'handler_z2_deputy',  email: 'h2d@foodsafety.gov.in', fullName: 'Anjali Nair', password: 'Handler@123' },
      { username: 'handler_z3_primary', email: 'h3p@foodsafety.gov.in', fullName: 'Vikram Reddy', password: 'Handler@123' },
      { username: 'handler_z3_deputy',  email: 'h3d@foodsafety.gov.in', fullName: 'Meena Iyer', password: 'Handler@123' },
      { username: 'handler_z4_primary', email: 'h4p@foodsafety.gov.in', fullName: 'Ravi Verma', password: 'Handler@123' },
      { username: 'handler_z4_deputy',  email: 'h4d@foodsafety.gov.in', fullName: 'Sunita Rao', password: 'Handler@123' },
      { username: 'handler_z5_primary', email: 'h5p@foodsafety.gov.in', fullName: 'Kiran Joshi', password: 'Handler@123' },
      { username: 'handler_z5_deputy',  email: 'h5d@foodsafety.gov.in', fullName: 'Deepa Menon', password: 'Handler@123' },
      { username: 'handler_z6_primary', email: 'h6p@foodsafety.gov.in', fullName: 'Arun Pillai', password: 'Handler@123' },
      { username: 'handler_z6_deputy',  email: 'h6d@foodsafety.gov.in', fullName: 'Kavya Nambiar', password: 'Handler@123' },
    ];

    const handlerUsers = [];
    for (const hData of handlerUsersData) {
      const u = await User.create({ ...hData, role: 'handler' });
      handlerUsers.push(u);
    }

    console.log(`✅ Created ${handlerUsers.length + 2} users`);

    // ── Zone config ──
    const zoneConfigs = [
      { zoneId: 'Zone-1', zoneName: 'Zone 1 - Bangalore North', pinCodeRangeStart: '560001', pinCodeRangeEnd: '569999', pinCodePrefix: '56', description: 'Bangalore North Region' },
      { zoneId: 'Zone-2', zoneName: 'Zone 2 - Mysore Region',   pinCodeRangeStart: '570001', pinCodeRangeEnd: '579999', pinCodePrefix: '57', description: 'Mysore Region' },
      { zoneId: 'Zone-3', zoneName: 'Zone 3 - Mangalore Region', pinCodeRangeStart: '580001', pinCodeRangeEnd: '589999', pinCodePrefix: '58', description: 'Mangalore Region' },
      { zoneId: 'Zone-4', zoneName: 'Zone 4 - Hubli-Dharwad',   pinCodeRangeStart: '590001', pinCodeRangeEnd: '599999', pinCodePrefix: '59', description: 'Hubli-Dharwad Region' },
      { zoneId: 'Zone-5', zoneName: 'Zone 5 - Chennai Region',  pinCodeRangeStart: '600001', pinCodeRangeEnd: '609999', pinCodePrefix: '60', description: 'Chennai Region' },
      { zoneId: 'Zone-6', zoneName: 'Zone 6 - Coimbatore Region', pinCodeRangeStart: '610001', pinCodeRangeEnd: '619999', pinCodePrefix: '61', description: 'Coimbatore Region' },
    ];

    // Create handler records first (without zone ref)
    const handlerRecords = [];
    for (let i = 0; i < 6; i++) {
      const primaryUser = handlerUsers[i * 2];
      const deputyUser  = handlerUsers[i * 2 + 1];
      const zone        = zoneConfigs[i];

      const primary = await Handler.create({
        userId: primaryUser._id,
        handlerId: `HND-Z${i+1}-P01`,
        fullName: primaryUser.fullName,
        email: primaryUser.email,
        zone: zone.zoneId,
        role: 'primary',
        isAvailable: true,
        maxCapacity: 10,
        currentOpenCases: 0
      });

      const deputy = await Handler.create({
        userId: deputyUser._id,
        handlerId: `HND-Z${i+1}-D01`,
        fullName: deputyUser.fullName,
        email: deputyUser.email,
        zone: zone.zoneId,
        role: 'deputy',
        isAvailable: true,
        maxCapacity: 10,
        currentOpenCases: 0
      });

      handlerRecords.push({ primary, deputy });
    }

    console.log('✅ Created 12 handler records');

    // ── Create Zones with officer references ──
    for (let i = 0; i < 6; i++) {
      const { primary, deputy } = handlerRecords[i];
      const zoneDoc = await Zone.create({
        ...zoneConfigs[i],
        primaryOfficer: primary._id,
        deputyOfficer: deputy._id,
        maxCapacity: 20,
        currentOpenCases: 0,
        isActive: true
      });

      // Link handler to zone
      await Handler.updateMany(
        { _id: { $in: [primary._id, deputy._id] } },
        { zoneId: zoneDoc._id }
      );
    }

    console.log('✅ Created 6 zones');

    // ── Classification Rules ──
    await ClassificationRule.insertMany([
      { categoryCode: 'CRITICAL', categoryName: 'Critical',  priority: 1, color: '#dc2626', emergencyOverride: true,  violationCodePattern: 'CRITICAL', description: 'Immediate health risk' },
      { categoryCode: 'MAJOR',    categoryName: 'Major',     priority: 2, color: '#ea580c', emergencyOverride: false, violationCodePattern: 'MAJOR',    description: 'Significant violation' },
      { categoryCode: 'MINOR',    categoryName: 'Minor',     priority: 3, color: '#ca8a04', emergencyOverride: false, violationCodePattern: 'MINOR',    description: 'Minor violation' },
      { categoryCode: 'ADVISORY', categoryName: 'Advisory',  priority: 4, color: '#2563eb', emergencyOverride: false, violationCodePattern: 'ADVISORY', description: 'Advisory notice' },
      { categoryCode: 'PASSED',   categoryName: 'Passed',    priority: 5, color: '#16a34a', emergencyOverride: false, violationCodePattern: 'PASSED',   description: 'Inspection passed' },
    ]);

    console.log('✅ Created classification rules');

    console.log('\n🎉 Database seeded successfully!\n');
    console.log('══════════════════════════════════════════');
    console.log('  DEMO ACCOUNTS');
    console.log('══════════════════════════════════════════');
    console.log('  Admin:     admin@foodsafety.gov.in     / Admin@123');
    console.log('  Inspector: inspector@foodsafety.gov.in / Inspector@123');
    console.log('  Handler:   h1p@foodsafety.gov.in       / Handler@123');
    console.log('══════════════════════════════════════════\n');

    if (shouldDisconnect) {
      await mongoose.disconnect();
    }
  } catch (error) {
    console.error('❌ Seed error:', error);
    if (shouldDisconnect) {
      await mongoose.disconnect();
      process.exit(1);
    }
    throw error;
  }
};

// Auto-run seed when file is executed
if (require.main === module) {
  seedData();
}

module.exports = { seedData };
