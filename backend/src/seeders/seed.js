// backend/src/seeders/seed.js
require('dotenv').config();
const { User, Product, Ingredient, Recipe, RecipeIngredient } = require('../models');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Sync database
    await sequelize.sync({ force: true });
    console.log('✅ Database synced');

    // 1. Create Users
    console.log('👥 Creating users...');
    const adminPassword = await bcrypt.hash('Admin123!', 10);
    const managerPassword = await bcrypt.hash('Manager123!', 10);
    const staffPassword = await bcrypt.hash('Staff123!', 10);

    const admin = await User.create({
      email: 'admin@restaurant.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin',
      is_active: true
    });

    const manager = await User.create({
      email: 'manager@restaurant.com',
      password: managerPassword,
      name: 'Manager User',
      role: 'manager',
      is_active: true
    });

    const staff = await User.create({
      email: 'staff@restaurant.com',
      password: staffPassword,
      name: 'Staff User',
      role: 'staff',
      is_active: true
    });

    console.log('✅ Users created');

    // 2. Create Products
    console.log('🍕 Creating products...');
    const products = await Product.bulkCreate([
      {
        name: 'Margherita Pizza',
        category: 'Pizza',
        price: 8.99,
        cost: 3.50,
        description: 'Klassische Pizza mit Tomaten und Mozzarella',
        is_available: true
      },
      {
        name: 'Pepperoni Pizza',
        category: 'Pizza',
        price: 10.99,
        cost: 4.20,
        description: 'Pizza mit würziger Pepperoni',
        is_available: true
      },
      {
        name: 'Spaghetti Carbonara',
        category: 'Pasta',
        price: 12.50,
        cost: 4.80,
        description: 'Cremige Carbonara mit Speck',
        is_available: true
      },
      {
        name: 'Caesar Salad',
        category: 'Salat',
        price: 7.99,
        cost: 3.20,
        description: 'Frischer Caesar Salat mit Hähnchen',
        is_available: true
      },
      {
        name: 'Tiramisu',
        category: 'Dessert',
        price: 6.50,
        cost: 2.80,
        description: 'Hausgemachtes italienisches Tiramisu',
        is_available: true
      },
      {
        name: 'Lasagne',
        category: 'Pasta',
        price: 11.99,
        cost: 4.50,
        description: 'Klassische Lasagne Bolognese',
        is_available: true
      },
      {
        name: 'Bruschetta',
        category: 'Vorspeise',
        price: 5.99,
        cost: 2.00,
        description: 'Geröstetes Brot mit Tomaten',
        is_available: true
      },
      {
        name: 'Coca Cola 0.5L',
        category: 'Getränke',
        price: 3.50,
        cost: 0.80,
        description: 'Erfrischende Cola',
        is_available: true
      }
    ]);

    console.log('✅ Products created');

    // 3. Create Ingredients
    console.log('🥬 Creating ingredients...');
    const ingredients = await Ingredient.bulkCreate([
      { name: 'Tomaten', unit: 'kg', cost_per_unit: 2.50, stock_quantity: 50, min_stock: 10 },
      { name: 'Mozzarella', unit: 'kg', cost_per_unit: 8.00, stock_quantity: 30, min_stock: 5 },
      { name: 'Mehl', unit: 'kg', cost_per_unit: 1.20, stock_quantity: 100, min_stock: 20 },
      { name: 'Pepperoni', unit: 'kg', cost_per_unit: 12.00, stock_quantity: 15, min_stock: 3 },
      { name: 'Spaghetti', unit: 'kg', cost_per_unit: 1.80, stock_per_unit: 40, min_stock: 10 },
      { name: 'Speck', unit: 'kg', cost_per_unit: 9.50, stock_quantity: 20, min_stock: 5 },
      { name: 'Eier', unit: 'Stk', cost_per_unit: 0.25, stock_quantity: 200, min_stock: 50 },
      { name: 'Parmesan', unit: 'kg', cost_per_unit: 15.00, stock_quantity: 10, min_stock: 2 },
      { name: 'Salat', unit: 'Stk', cost_per_unit: 1.50, stock_quantity: 30, min_stock: 10 },
      { name: 'Hähnchenbrust', unit: 'kg', cost_per_unit: 7.50, stock_quantity: 25, min_stock: 5 }
    ]);

    console.log('✅ Ingredients created');

    // 4. Create Recipes
    console.log('📖 Creating recipes...');
    
    // Margherita Recipe
    const margheritaRecipe = await Recipe.create({
      product_id: products[0].id,
      instructions: '1. Teig vorbereiten\n2. Tomatensauce auftragen\n3. Mozzarella verteilen\n4. Bei 250°C 12 Min. backen',
      prep_time: 15,
      is_active: true
    });

    await RecipeIngredient.bulkCreate([
      { recipe_id: margheritaRecipe.id, ingredient_id: ingredients[0].id, quantity: 0.15 }, // Tomaten
      { recipe_id: margheritaRecipe.id, ingredient_id: ingredients[1].id, quantity: 0.20 }, // Mozzarella
      { recipe_id: margheritaRecipe.id, ingredient_id: ingredients[2].id, quantity: 0.25 }  // Mehl
    ]);

    // Pepperoni Recipe
    const pepperoniRecipe = await Recipe.create({
      product_id: products[1].id,
      instructions: '1. Teig vorbereiten\n2. Tomatensauce auftragen\n3. Mozzarella und Pepperoni verteilen\n4. Bei 250°C 12 Min. backen',
      prep_time: 15,
      is_active: true
    });

    await RecipeIngredient.bulkCreate([
      { recipe_id: pepperoniRecipe.id, ingredient_id: ingredients[0].id, quantity: 0.15 }, // Tomaten
      { recipe_id: pepperoniRecipe.id, ingredient_id: ingredients[1].id, quantity: 0.20 }, // Mozzarella
      { recipe_id: pepperoniRecipe.id, ingredient_id: ingredients[2].id, quantity: 0.25 }, // Mehl
      { recipe_id: pepperoniRecipe.id, ingredient_id: ingredients[3].id, quantity: 0.08 }  // Pepperoni
    ]);

    // Carbonara Recipe
    const carbonaraRecipe = await Recipe.create({
      product_id: products[2].id,
      instructions: '1. Spaghetti kochen\n2. Speck anbraten\n3. Ei-Parmesan-Mischung vorbereiten\n4. Alles vermengen',
      prep_time: 20,
      is_active: true
    });

    await RecipeIngredient.bulkCreate([
      { recipe_id: carbonaraRecipe.id, ingredient_id: ingredients[4].id, quantity: 0.15 }, // Spaghetti
      { recipe_id: carbonaraRecipe.id, ingredient_id: ingredients[5].id, quantity: 0.08 }, // Speck
      { recipe_id: carbonaraRecipe.id, ingredient_id: ingredients[6].id, quantity: 2 },    // Eier
      { recipe_id: carbonaraRecipe.id, ingredient_id: ingredients[7].id, quantity: 0.05 }  // Parmesan
    ]);

    console.log('✅ Recipes created');

    // 5. Create Sample Sales (last 30 days)
    console.log('💰 Creating sample sales...');
    const sales = [];
    const now = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // 5-15 random sales per day
      const numSales = Math.floor(Math.random() * 10) + 5;
      
      for (let j = 0; j < numSales; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1;
        const paymentMethods = ['cash', 'card', 'online'];
        
        sales.push({
          product_id: product.id,
          user_id: staff.id,
          quantity: quantity,
          unit_price: product.price,
          total_price: product.price * quantity,
          payment_method: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
          status: 'completed',
          sale_date: new Date(date.getTime() + Math.random() * 86400000), // Random time of day
          createdAt: new Date(date.getTime() + Math.random() * 86400000),
          updatedAt: new Date(date.getTime() + Math.random() * 86400000)
        });
      }
    }

    await sequelize.models.Sale.bulkCreate(sales);
    console.log(`✅ ${sales.length} sales created`);

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📧 Login Credentials:');
    console.log('┌─────────────────────────────────────────┐');
    console.log('│ 👤 ADMIN                                │');
    console.log('│ Email:    admin@restaurant.com          │');
    console.log('│ Password: Admin123!                     │');
    console.log('├─────────────────────────────────────────┤');
    console.log('│ 👤 MANAGER                              │');
    console.log('│ Email:    manager@restaurant.com        │');
    console.log('│ Password: Manager123!                   │');
    console.log('├─────────────────────────────────────────┤');
    console.log('│ 👤 STAFF                                │');
    console.log('│ Email:    staff@restaurant.com          │');
    console.log('│ Password: Staff123!                     │');
    console.log('└─────────────────────────────────────────┘\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();