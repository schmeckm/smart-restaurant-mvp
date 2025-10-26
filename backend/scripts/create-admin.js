// backend/scripts/create-admin.js
// Erstellt Admin User und Test-Daten

const { User, Category, Ingredient } = require('../src/models');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  try {
    console.log('🔐 Creating admin user...\n');

    // Check if admin exists
    const existingAdmin = await User.findOne({ 
      where: { email: 'admin@restaurant.com' } 
    });

    if (existingAdmin) {
      console.log('✅ Admin user already exists!');
      console.log('   Email: admin@restaurant.com');
      console.log('   Password: admin123\n');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const admin = await User.create({
      email: 'admin@restaurant.com',
      password: hashedPassword,
      name: 'Admin User',
      role: 'admin',
      isActive: true
    });

    console.log('✅ Admin user created!');
    console.log('   Email: admin@restaurant.com');
    console.log('   Password: admin123');
    console.log('   ID:', admin.id, '\n');

    // Create categories
    console.log('📁 Creating categories...');
    const categories = [
      { name: 'Pizza', color: '#FF6B6B', icon: '🍕' },
      { name: 'Pasta', color: '#4ECDC4', icon: '🍝' },
      { name: 'Salad', color: '#95E1D3', icon: '🥗' },
      { name: 'Dessert', color: '#F38181', icon: '🍰' },
      { name: 'Drinks', color: '#AA96DA', icon: '🥤' }
    ];

    for (const cat of categories) {
      await Category.findOrCreate({
        where: { name: cat.name },
        defaults: cat
      });
    }
    console.log('✅ Categories created\n');

    // Create sample ingredients
    console.log('🥬 Creating sample ingredients...');
    const ingredients = [
      { name: 'Flour', unit: 'g', pricePerUnit: 0.002, stockQuantity: 5000, minStock: 1000 },
      { name: 'Tomatoes', unit: 'g', pricePerUnit: 0.005, stockQuantity: 2000, minStock: 500 },
      { name: 'Mozzarella', unit: 'g', pricePerUnit: 0.012, stockQuantity: 3000, minStock: 500 },
      { name: 'Olive Oil', unit: 'ml', pricePerUnit: 0.015, stockQuantity: 1000, minStock: 200 },
      { name: 'Basil', unit: 'g', pricePerUnit: 0.08, stockQuantity: 100, minStock: 20 }
    ];

    for (const ing of ingredients) {
      await Ingredient.findOrCreate({
        where: { name: ing.name },
        defaults: ing
      });
    }
    console.log('✅ Sample ingredients created\n');

    console.log('🎉 SETUP COMPLETE!\n');
    console.log('You can now login with:');
    console.log('   Email: admin@restaurant.com');
    console.log('   Password: admin123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createAdmin();