// backend/create-admin.js
require('dotenv').config();
const { User } = require('./src/models');
const sequelize = require('./src/config/database');

const createAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database\n');

    // Check if admin exists
    const existing = await User.findOne({ 
      where: { email: 'admin@restaurant.com' } 
    });

    if (existing) {
      console.log('⚠️  Admin user already exists!');
      console.log('Deleting old admin...');
      await existing.destroy();
    }

    // Create new admin - OHNE manuelles Hashing!
    // Der beforeCreate Hook im Model übernimmt das Hashing
    const admin = await User.create({
      email: 'admin@restaurant.com',
      password: 'Admin123!',  // ← PLAIN TEXT! Hook hasht es automatisch
      name: 'Admin User',
      role: 'admin',
      is_active: true
    });

    console.log('✅ Admin user created successfully!\n');
    console.log('═══════════════════════════════════════');
    console.log('📧 Email:    admin@restaurant.com');
    console.log('🔑 Password: Admin123!');
    console.log('═══════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createAdmin();