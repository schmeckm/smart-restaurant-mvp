// backend/scripts/force-reset.js
// FORCE RESET - Droppt ALLE Tabellen und erstellt sie neu

const { Sequelize } = require('sequelize');
require('dotenv').config();

async function forceReset() {
  console.log('⚠️  FORCE RESET - This will DELETE ALL DATA!\n');

  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      dialect: 'postgres',
      logging: false
    }
  );

  try {
    await sequelize.authenticate();
    console.log('✅ Connected\n');

    console.log('🗑️  Dropping ALL tables...');
    
    // Drop alles in der richtigen Reihenfolge
    const tables = [
      'forecast_items',
      'forecast_versions', 
      'sales',
      'product_ingredients',
      'nutrition',
      'products',
      'ingredients',
      'categories',
      'users',
      'recipe_ingredients',
      'recipes'
    ];

    for (const table of tables) {
      try {
        await sequelize.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`   ✅ ${table}`);
      } catch (err) {
        // Ignore
      }
    }

    // Drop ENUMs
    const enums = [
      'enum_users_role',
      'enum_products_difficulty',
      'enum_ingredients_unit',
      'enum_product_ingredients_unit',
      'enum_sales_payment_method',
      'enum_sales_status',
      'enum_nutrition_entity_type',
      'enum_nutrition_nutrition_source'
    ];

    console.log('\n🗑️  Dropping ENUMs...');
    for (const enumType of enums) {
      try {
        await sequelize.query(`DROP TYPE IF EXISTS ${enumType} CASCADE`);
        console.log(`   ✅ ${enumType}`);
      } catch (err) {
        // Ignore
      }
    }

    await sequelize.close();
    console.log('\n✅ All tables dropped!\n');
    console.log('Now run: npm start\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

forceReset();