// backend/migrations/20251025_convert_to_uuid.js
// Migration: Convert INTEGER IDs to UUID

'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🚀 Starting UUID migration...');
    
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // ==========================================
      // STEP 1: Create temporary ID mapping tables
      // ==========================================
      
      console.log('📋 Step 1: Creating ID mapping tables...');
      
      await queryInterface.createTable('temp_product_id_map', {
        old_id: { type: Sequelize.INTEGER, primaryKey: true },
        new_id: { type: Sequelize.UUID, allowNull: false }
      }, { transaction });

      await queryInterface.createTable('temp_ingredient_id_map', {
        old_id: { type: Sequelize.INTEGER, primaryKey: true },
        new_id: { type: Sequelize.UUID, allowNull: false }
      }, { transaction });

      // ==========================================
      // STEP 2: Backup existing data
      // ==========================================
      
      console.log('💾 Step 2: Backing up data...');
      
      const products = await queryInterface.sequelize.query(
        'SELECT * FROM products',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      const ingredients = await queryInterface.sequelize.query(
        'SELECT * FROM ingredients',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      const productIngredients = await queryInterface.sequelize.query(
        'SELECT * FROM product_ingredients',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      const sales = await queryInterface.sequelize.query(
        'SELECT * FROM sales',
        { type: Sequelize.QueryTypes.SELECT, transaction }
      );

      // ==========================================
      // STEP 3: Generate UUID mappings
      // ==========================================
      
      console.log('🔄 Step 3: Generating UUID mappings...');
      
      const productIdMap = {};
      for (const product of products) {
        const newUuid = uuidv4();
        productIdMap[product.id] = newUuid;
        
        await queryInterface.sequelize.query(
          'INSERT INTO temp_product_id_map (old_id, new_id) VALUES (?, ?)',
          { replacements: [product.id, newUuid], transaction }
        );
      }

      const ingredientIdMap = {};
      for (const ingredient of ingredients) {
        const newUuid = uuidv4();
        ingredientIdMap[ingredient.id] = newUuid;
        
        await queryInterface.sequelize.query(
          'INSERT INTO temp_ingredient_id_map (old_id, new_id) VALUES (?, ?)',
          { replacements: [ingredient.id, newUuid], transaction }
        );
      }

      // ==========================================
      // STEP 4: Drop dependent tables
      // ==========================================
      
      console.log('🗑️  Step 4: Dropping dependent tables...');
      
      await queryInterface.dropTable('sales', { transaction });
      await queryInterface.dropTable('product_ingredients', { transaction });
      await queryInterface.dropTable('forecast_items', { transaction, cascade: true });

      // ==========================================
      // STEP 5: Modify Products table
      // ==========================================
      
      console.log('🔧 Step 5: Converting Products to UUID...');
      
      await queryInterface.sequelize.query(
        'ALTER TABLE products DROP CONSTRAINT IF EXISTS products_pkey CASCADE',
        { transaction }
      );
      
      await queryInterface.addColumn('products', 'new_id', {
        type: Sequelize.UUID,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('products', 'new_category_id', {
        type: Sequelize.UUID,
        allowNull: true
      }, { transaction });

      // Update new_id values
      for (const [oldId, newId] of Object.entries(productIdMap)) {
        await queryInterface.sequelize.query(
          'UPDATE products SET new_id = ? WHERE id = ?',
          { replacements: [newId, oldId], transaction }
        );
      }

      await queryInterface.removeColumn('products', 'id', { transaction });
      await queryInterface.renameColumn('products', 'new_id', 'id', { transaction });
      
      await queryInterface.changeColumn('products', 'id', {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      }, { transaction });

      // Add new fields to products
      await queryInterface.addColumn('products', 'instructions', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('products', 'prep_time', {
        type: Sequelize.INTEGER,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('products', 'cook_time', {
        type: Sequelize.INTEGER,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('products', 'servings', {
        type: Sequelize.INTEGER,
        defaultValue: 1
      }, { transaction });

      await queryInterface.addColumn('products', 'difficulty', {
        type: Sequelize.ENUM('easy', 'medium', 'hard'),
        defaultValue: 'medium'
      }, { transaction });

      await queryInterface.addColumn('products', 'tags', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      }, { transaction });

      // ==========================================
      // STEP 6: Modify Ingredients table
      // ==========================================
      
      console.log('🔧 Step 6: Converting Ingredients to UUID...');
      
      await queryInterface.sequelize.query(
        'ALTER TABLE ingredients DROP CONSTRAINT IF EXISTS ingredients_pkey CASCADE',
        { transaction }
      );
      
      await queryInterface.addColumn('ingredients', 'new_id', {
        type: Sequelize.UUID,
        allowNull: true
      }, { transaction });

      // Update new_id values
      for (const [oldId, newId] of Object.entries(ingredientIdMap)) {
        await queryInterface.sequelize.query(
          'UPDATE ingredients SET new_id = ? WHERE id = ?',
          { replacements: [newId, oldId], transaction }
        );
      }

      await queryInterface.removeColumn('ingredients', 'id', { transaction });
      await queryInterface.renameColumn('ingredients', 'new_id', 'id', { transaction });
      
      await queryInterface.changeColumn('ingredients', 'id', {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false
      }, { transaction });

      // Update unit ENUM
      await queryInterface.changeColumn('ingredients', 'unit', {
        type: Sequelize.ENUM('g', 'kg', 'ml', 'l', 'piece', 'tbsp', 'tsp', 'cup'),
        allowNull: false,
        defaultValue: 'g'
      }, { transaction });

      // Add new fields to ingredients
      await queryInterface.addColumn('ingredients', 'allergens', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      }, { transaction });

      await queryInterface.addColumn('ingredients', 'storage_info', {
        type: Sequelize.TEXT,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('ingredients', 'shelf_life', {
        type: Sequelize.INTEGER,
        allowNull: true
      }, { transaction });

      await queryInterface.addColumn('ingredients', 'supplier_code', {
        type: Sequelize.STRING(100),
        allowNull: true
      }, { transaction });

      // ==========================================
      // STEP 7: Recreate product_ingredients table
      // ==========================================
      
      console.log('🔧 Step 7: Recreating product_ingredients...');
      
      await queryInterface.createTable('product_ingredients', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        product_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'products', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        ingredient_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'ingredients', key: 'id' },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
        },
        quantity: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false
        },
        unit: {
          type: Sequelize.ENUM('g', 'kg', 'ml', 'l', 'piece', 'tbsp', 'tsp', 'cup'),
          allowNull: false,
          defaultValue: 'g'
        },
        preparation_note: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        is_optional: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        substitute_for: {
          type: Sequelize.UUID,
          allowNull: true
        },
        sort_order: {
          type: Sequelize.INTEGER,
          defaultValue: 0
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // Restore data with new UUIDs
      for (const pi of productIngredients) {
        const newProductId = productIdMap[pi.product_id];
        const newIngredientId = ingredientIdMap[pi.ingredient_id];
        
        if (newProductId && newIngredientId) {
          await queryInterface.sequelize.query(
            `INSERT INTO product_ingredients 
             (id, product_id, ingredient_id, quantity, unit, preparation_note, is_optional, sort_order, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            {
              replacements: [
                uuidv4(),
                newProductId,
                newIngredientId,
                pi.quantity,
                pi.unit || 'g',
                pi.preparation_note,
                pi.is_optional || false,
                pi.sort_order || 0,
                pi.created_at || new Date(),
                pi.updated_at || new Date()
              ],
              transaction
            }
          );
        }
      }

      // ==========================================
      // STEP 8: Recreate sales table
      // ==========================================
      
      console.log('🔧 Step 8: Recreating sales...');
      
      await queryInterface.createTable('sales', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        product_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'products', key: 'id' }
        },
        user_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'users', key: 'id' }
        },
        quantity: {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 1
        },
        unit_price: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false
        },
        total_price: {
          type: Sequelize.DECIMAL(10, 2),
          allowNull: false
        },
        discount: {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0
        },
        tax: {
          type: Sequelize.DECIMAL(10, 2),
          defaultValue: 0
        },
        payment_method: {
          type: Sequelize.ENUM('cash', 'card', 'online', 'invoice'),
          defaultValue: 'cash'
        },
        status: {
          type: Sequelize.ENUM('pending', 'completed', 'cancelled', 'refunded'),
          defaultValue: 'completed'
        },
        sale_date: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        notes: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        reference_number: {
          type: Sequelize.STRING(50),
          allowNull: true,
          unique: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // Restore sales data with new product UUIDs
      for (const sale of sales) {
        const newProductId = productIdMap[sale.product_id];
        
        if (newProductId) {
          await queryInterface.sequelize.query(
            `INSERT INTO sales 
             (id, product_id, user_id, quantity, unit_price, total_price, payment_method, status, sale_date, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            {
              replacements: [
                sale.id, // Keep existing UUID
                newProductId,
                sale.user_id,
                sale.quantity,
                sale.unit_price,
                sale.total_price,
                sale.payment_method || 'cash',
                sale.status || 'completed',
                sale.sale_date || new Date(),
                sale.created_at || new Date(),
                sale.updated_at || new Date()
              ],
              transaction
            }
          );
        }
      }

      // ==========================================
      // STEP 9: Update forecast_items table
      // ==========================================
      
      console.log('🔧 Step 9: Updating forecast_items...');
      
      await queryInterface.createTable('forecast_items', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        version_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'forecast_versions', key: 'id' }
        },
        product_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: { model: 'products', key: 'id' }
        },
        quantity: {
          type: Sequelize.FLOAT,
          allowNull: false
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
        }
      }, { transaction });

      // ==========================================
      // STEP 10: Cleanup
      // ==========================================
      
      console.log('🧹 Step 10: Cleanup...');
      
      await queryInterface.dropTable('temp_product_id_map', { transaction });
      await queryInterface.dropTable('temp_ingredient_id_map', { transaction });

      // Drop old Recipe tables if they exist
      await queryInterface.dropTable('recipe_ingredients', { transaction, cascade: true }).catch(() => {});
      await queryInterface.dropTable('recipes', { transaction, cascade: true }).catch(() => {});

      await transaction.commit();
      console.log('✅ UUID migration completed successfully!');
      
    } catch (error) {
      await transaction.rollback();
      console.error('❌ Migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Downgrade not recommended - would lose UUID data
    throw new Error('Downgrade from UUID to INTEGER is not supported. Restore from backup instead.');
  }
};