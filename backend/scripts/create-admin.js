// backend/scripts/create-admin.js
const bcrypt = require('bcryptjs');
const { sequelize, Restaurant, User } = require('../src/models');
require('dotenv').config();

const createAdmin = async () => {
  try {
    // Test DB connection
    await sequelize.authenticate();
    console.log('✅ Database connection established successfully\n');

    // ========== SCHRITT 1: Restaurant erstellen ==========
    console.log('🏢 Creating default restaurant...');
    
    const [restaurant, restaurantCreated] = await Restaurant.findOrCreate({
      where: { name: 'Demo Restaurant' },
      defaults: {
        name: 'Demo Restaurant',
        email: 'info@restaurant.com',
        phone: '+41 12 345 67 89',
        street: 'Hauptstrasse 1',
        city: 'Zürich',
        postalCode: '8001',
        country: 'CH',
        preferredLanguage: 'de',
        supportedLanguages: ['de', 'en'],
        unitSystem: 'metric',
        currency: 'CHF',
        timezone: 'Europe/Zurich',
        dateFormat: 'DD.MM.YYYY',
        isActive: true
      }
    });

    if (restaurantCreated) {
      console.log('✅ Restaurant created:', restaurant.name);
      console.log('   ID:', restaurant.id);
    } else {
      console.log('ℹ️  Restaurant already exists:', restaurant.name);
      console.log('   ID:', restaurant.id);
    }
    console.log();

    // ========== SCHRITT 2: Admin User erstellen ==========
    console.log('🔐 Creating admin user...');
    
    const adminEmail = 'admin@restaurant.com';
    
    // Check if admin exists
    const existingAdmin = await User.findOne({ 
      where: { email: adminEmail } 
    });

    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists:', adminEmail);
      console.log('   Restaurant:', restaurant.name);
      console.log('   Role:', existingAdmin.role);
      console.log();
      console.log('✅ Setup complete!\n');
      process.exit(0);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user WITH restaurant_id
    const admin = await User.create({
      email: adminEmail,
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
      restaurantId: restaurant.id,  // ← WICHTIG!
      uiLanguage: 'de',
      isActive: true
    });

    console.log('✅ Admin user created successfully!');
    console.log();
    console.log('📋 Login Credentials:');
    console.log('   Email:    ', admin.email);
    console.log('   Password: ', 'admin123');
    console.log('   Role:     ', admin.role);
    console.log('   Restaurant:', restaurant.name);
    console.log();
    console.log('🚀 You can now login with these credentials!\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Run if called directly
if (require.main === module) {
  console.log('🔐 Creating admin user...\n');
  createAdmin();
}

module.exports = createAdmin;