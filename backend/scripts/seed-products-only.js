// backend/scripts/seed-products-only.js
// Minimal Seed - Only Products (Recipes can be generated via UI with AI)

const { Product, Category, sequelize } = require('../src/models');

async function seedProductsOnly() {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('🌱 Seeding products (using existing data where available)...\n');

    // 1. Find or Create Categories
    console.log('📁 Finding or creating categories...');
    
    const categories = [];
    
    const [pizza] = await Category.findOrCreate({
      where: { name: 'Pizza' },
      defaults: {
        description: 'Italian pizzas',
        color: '#FF6B6B',
        icon: '🍕',
        sortOrder: 1,
        isActive: true
      },
      transaction
    });
    categories.push(pizza);
    
    const [pasta] = await Category.findOrCreate({
      where: { name: 'Pasta' },
      defaults: {
        description: 'Italian pasta dishes',
        color: '#4ECDC4',
        icon: '🍝',
        sortOrder: 2,
        isActive: true
      },
      transaction
    });
    categories.push(pasta);
    
    const [salad] = await Category.findOrCreate({
      where: { name: 'Salad' },
      defaults: {
        description: 'Fresh salads',
        color: '#95E1D3',
        icon: '🥗',
        sortOrder: 3,
        isActive: true
      },
      transaction
    });
    categories.push(salad);
    
    const [burger] = await Category.findOrCreate({
      where: { name: 'Burger' },
      defaults: {
        description: 'Burgers and sandwiches',
        color: '#F38181',
        icon: '🍔',
        sortOrder: 4,
        isActive: true
      },
      transaction
    });
    categories.push(burger);
    
    const [dessert] = await Category.findOrCreate({
      where: { name: 'Dessert' },
      defaults: {
        description: 'Sweet desserts',
        color: '#AA96DA',
        icon: '🍰',
        sortOrder: 5,
        isActive: true
      },
      transaction
    });
    categories.push(dessert);
    
    const [drinks] = await Category.findOrCreate({
      where: { name: 'Drinks' },
      defaults: {
        description: 'Beverages',
        color: '#FCBAD3',
        icon: '🥤',
        sortOrder: 6,
        isActive: true
      },
      transaction
    });
    categories.push(drinks);
    
    console.log(`✅ ${categories.length} Categories ready\n`);

    // 2. Find or Create Products (WITHOUT instructions - will be generated via UI)
    console.log('🍽️  Finding or creating products...\n');
    
    const products = [];
    
    // PIZZAS
    const [margherita] = await Product.findOrCreate({
      where: { name: 'Pizza Margherita' },
      defaults: {
        categoryId: categories[0].id,
        price: 9.90,
        description: 'Classic Italian pizza with tomato, mozzarella, and basil',
        isActive: true,
        sortOrder: 1
      },
      transaction
    });
    products.push(margherita);
    
    const [pepperoni] = await Product.findOrCreate({
      where: { name: 'Pizza Pepperoni' },
      defaults: {
        categoryId: categories[0].id,
        price: 12.90,
        description: 'Pizza with pepperoni and extra cheese',
        isActive: true,
        sortOrder: 2
      },
      transaction
    });
    products.push(pepperoni);
    
    const [funghi] = await Product.findOrCreate({
      where: { name: 'Pizza Funghi' },
      defaults: {
        categoryId: categories[0].id,
        price: 11.50,
        description: 'Pizza with mushrooms and mozzarella',
        isActive: true,
        sortOrder: 3
      },
      transaction
    });
    products.push(funghi);
    
    const [quattro] = await Product.findOrCreate({
      where: { name: 'Pizza Quattro Stagioni' },
      defaults: {
        categoryId: categories[0].id,
        price: 13.90,
        description: 'Four seasons pizza with ham, mushrooms, artichokes, and olives',
        isActive: true,
        sortOrder: 4
      },
      transaction
    });
    products.push(quattro);
    
    // PASTA
    const [carbonara] = await Product.findOrCreate({
      where: { name: 'Spaghetti Carbonara' },
      defaults: {
        categoryId: categories[1].id,
        price: 13.50,
        description: 'Classic Roman pasta with bacon, eggs, and parmesan',
        isActive: true,
        sortOrder: 1
      },
      transaction
    });
    products.push(carbonara);
    
    const [alfredo] = await Product.findOrCreate({
      where: { name: 'Fettuccine Alfredo' },
      defaults: {
        categoryId: categories[1].id,
        price: 12.90,
        description: 'Creamy pasta with parmesan and butter',
        isActive: true,
        sortOrder: 2
      },
      transaction
    });
    products.push(alfredo);
    
    const [arrabbiata] = await Product.findOrCreate({
      where: { name: 'Penne Arrabbiata' },
      defaults: {
        categoryId: categories[1].id,
        price: 11.50,
        description: 'Spicy tomato pasta with garlic and chili',
        isActive: true,
        sortOrder: 3
      },
      transaction
    });
    products.push(arrabbiata);
    
    const [lasagna] = await Product.findOrCreate({
      where: { name: 'Lasagna Bolognese' },
      defaults: {
        categoryId: categories[1].id,
        price: 14.90,
        description: 'Layered pasta with meat sauce and béchamel',
        isActive: true,
        sortOrder: 4
      },
      transaction
    });
    products.push(lasagna);
    
    // SALADS
    const [caesar] = await Product.findOrCreate({
      where: { name: 'Caesar Salad' },
      defaults: {
        categoryId: categories[2].id,
        price: 8.90,
        description: 'Romaine lettuce with Caesar dressing and parmesan',
        isActive: true,
        sortOrder: 1
      },
      transaction
    });
    products.push(caesar);
    
    const [greek] = await Product.findOrCreate({
      where: { name: 'Greek Salad' },
      defaults: {
        categoryId: categories[2].id,
        price: 9.50,
        description: 'Fresh vegetables with feta cheese and olives',
        isActive: true,
        sortOrder: 2
      },
      transaction
    });
    products.push(greek);
    
    const [caprese] = await Product.findOrCreate({
      where: { name: 'Caprese Salad' },
      defaults: {
        categoryId: categories[2].id,
        price: 8.50,
        description: 'Tomato, mozzarella, and basil',
        isActive: true,
        sortOrder: 3
      },
      transaction
    });
    products.push(caprese);
    
    // BURGERS
    const [cheeseburger] = await Product.findOrCreate({
      where: { name: 'Classic Cheeseburger' },
      defaults: {
        categoryId: categories[3].id,
        price: 11.90,
        description: 'Beef patty with cheddar, lettuce, tomato, and onion',
        isActive: true,
        sortOrder: 1
      },
      transaction
    });
    products.push(cheeseburger);
    
    const [bbqburger] = await Product.findOrCreate({
      where: { name: 'BBQ Bacon Burger' },
      defaults: {
        categoryId: categories[3].id,
        price: 13.90,
        description: 'Beef patty with bacon, BBQ sauce, and onion rings',
        isActive: true,
        sortOrder: 2
      },
      transaction
    });
    products.push(bbqburger);
    
    const [veggieburger] = await Product.findOrCreate({
      where: { name: 'Veggie Burger' },
      defaults: {
        categoryId: categories[3].id,
        price: 10.90,
        description: 'Plant-based patty with avocado and sprouts',
        tags: ['vegetarian', 'vegan'],
        isActive: true,
        sortOrder: 3
      },
      transaction
    });
    products.push(veggieburger);
    
    // DESSERTS
    const [tiramisu] = await Product.findOrCreate({
      where: { name: 'Tiramisu' },
      defaults: {
        categoryId: categories[4].id,
        price: 6.90,
        description: 'Classic Italian coffee-flavored dessert',
        isActive: true,
        sortOrder: 1
      },
      transaction
    });
    products.push(tiramisu);
    
    const [pannacotta] = await Product.findOrCreate({
      where: { name: 'Panna Cotta' },
      defaults: {
        categoryId: categories[4].id,
        price: 5.90,
        description: 'Italian cream dessert with berry sauce',
        isActive: true,
        sortOrder: 2
      },
      transaction
    });
    products.push(pannacotta);
    
    const [lavacake] = await Product.findOrCreate({
      where: { name: 'Chocolate Lava Cake' },
      defaults: {
        categoryId: categories[4].id,
        price: 7.50,
        description: 'Warm chocolate cake with molten center',
        isActive: true,
        sortOrder: 3
      },
      transaction
    });
    products.push(lavacake);
    
    // DRINKS
    const [cola] = await Product.findOrCreate({
      where: { name: 'Coca Cola' },
      defaults: {
        categoryId: categories[5].id,
        price: 2.50,
        description: 'Classic Coca Cola 0.33L',
        isActive: true,
        sortOrder: 1
      },
      transaction
    });
    products.push(cola);
    
    const [water] = await Product.findOrCreate({
      where: { name: 'Still Water' },
      defaults: {
        categoryId: categories[5].id,
        price: 2.00,
        description: 'Still mineral water 0.5L',
        isActive: true,
        sortOrder: 2
      },
      transaction
    });
    products.push(water);
    
    const [orange] = await Product.findOrCreate({
      where: { name: 'Orange Juice' },
      defaults: {
        categoryId: categories[5].id,
        price: 3.50,
        description: 'Fresh orange juice 0.25L',
        isActive: true,
        sortOrder: 3
      },
      transaction
    });
    products.push(orange);
    
    const [espresso] = await Product.findOrCreate({
      where: { name: 'Espresso' },
      defaults: {
        categoryId: categories[5].id,
        price: 2.00,
        description: 'Italian espresso',
        isActive: true,
        sortOrder: 4
      },
      transaction
    });
    products.push(espresso);
    
    const [cappuccino] = await Product.findOrCreate({
      where: { name: 'Cappuccino' },
      defaults: {
        categoryId: categories[5].id,
        price: 3.50,
        description: 'Espresso with steamed milk foam',
        isActive: true,
        sortOrder: 5
      },
      transaction
    });
    products.push(cappuccino);

    await transaction.commit();
    
    console.log(`✅ ${products.length} Products ready\n`);
    
    console.log('🎉 SEEDING COMPLETE!\n');
    console.log('📊 Summary:');
    console.log(`   - ${categories.length} categories available`);
    console.log(`   - ${products.length} products ready`);
    console.log('\n✨ Note: Existing data was preserved! New items were added only if they didn\'t exist.\n');
    console.log('💡 You can now add recipes via UI with AI!\n');

    process.exit(0);
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  seedProductsOnly();
}

module.exports = seedProductsOnly;