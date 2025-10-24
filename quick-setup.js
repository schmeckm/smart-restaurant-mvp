// backend/quick-setup.js
require('dotenv').config();
const { User } = require('./src/models');
const sequelize = require('./src/config/database');
const bcrypt = require('bcryptjs');

const quickSetup = async () => {
  try {
    console.log('🚀 Starting quick setup...\n');

    // Test database connection
    console.log('📡 Testing database connection...');
    await sequelize.authenticate();
    console.log('✅ Database connected!\n');

    // Sync database (force: true drops all tables)
    console.log('🔄 Syncing database...');
    await sequelize.sync({ force: true });
    console.log('✅ Database synced!\n');

    // Create admin user
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    
    await User.create({
      email: 'admin@restaurant.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
      is_active: true
    });

    console.log('✅ Admin user created!\n');
    console.log('═══════════════════════════════════════');
    console.log('🎉 Setup completed successfully!\n');
    console.log('📧 Login with:');
    console.log('   Email:    admin@restaurant.com');
    console.log('   Password: Admin123!');
    console.log('═══════════════════════════════════════\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('\nDetails:', error);
    process.exit(1);
  }
};

quickSetup();