// migrations/20251107131804-add-gps-coordinates-to-restaurants.js - SAFE VERSION
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('🗺️ Adding GPS coordinates to restaurants table (safe mode)...');
    
    try {
      // Check if restaurants table exists
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('restaurants')) {
        throw new Error('Restaurants table does not exist');
      }

      console.log('✅ Restaurants table found');

      // Get existing columns
      const tableDescription = await queryInterface.describeTable('restaurants');
      const existingColumns = Object.keys(tableDescription);
      console.log('🔍 Existing columns:', existingColumns.join(', '));

      // Add city field (if not exists)
      if (!existingColumns.includes('city')) {
        await queryInterface.addColumn('restaurants', 'city', {
          type: Sequelize.STRING,
          allowNull: true,
          comment: 'Stadt für GPS-Fallback und Event-Analyse'
        });
        console.log('✅ Added city column');
      } else {
        console.log('ℹ️ City column already exists, skipping...');
      }

      // Add postal_code field (if not exists)
      if (!existingColumns.includes('postal_code')) {
        await queryInterface.addColumn('restaurants', 'postal_code', {
          type: Sequelize.STRING(10),
          allowNull: true,
          comment: 'Schweizer PLZ (4 Stellen) für Geocoding'
        });
        console.log('✅ Added postal_code column');
      } else {
        console.log('ℹ️ postal_code column already exists, skipping...');
      }

      // Add latitude field (if not exists)
      if (!existingColumns.includes('latitude')) {
        await queryInterface.addColumn('restaurants', 'latitude', {
          type: Sequelize.DECIMAL(10, 8),
          allowNull: true,
          comment: 'GPS Breitengrad (Schweizer Grenzen: 45.8-47.9)'
        });
        console.log('✅ Added latitude column');
      } else {
        console.log('ℹ️ latitude column already exists, skipping...');
      }

      // Add longitude field (if not exists)
      if (!existingColumns.includes('longitude')) {
        await queryInterface.addColumn('restaurants', 'longitude', {
          type: Sequelize.DECIMAL(11, 8), 
          allowNull: true,
          comment: 'GPS Längengrad (Schweizer Grenzen: 5.9-10.6)'
        });
        console.log('✅ Added longitude column');
      } else {
        console.log('ℹ️ longitude column already exists, skipping...');
      }

      // Add indexes (safe mode)
      const indexes = await queryInterface.showIndex('restaurants');
      const indexNames = indexes.map(idx => idx.name);

      if (!indexNames.includes('idx_restaurants_gps_coords')) {
        try {
          await queryInterface.addIndex('restaurants', ['latitude', 'longitude'], {
            name: 'idx_restaurants_gps_coords'
          });
          console.log('✅ Added GPS coordinates index');
        } catch (e) {
          console.log('ℹ️ GPS index creation skipped:', e.message);
        }
      } else {
        console.log('ℹ️ GPS index already exists, skipping...');
      }

      if (!indexNames.includes('idx_restaurants_city')) {
        try {
          await queryInterface.addIndex('restaurants', ['city'], {
            name: 'idx_restaurants_city'
          });
          console.log('✅ Added city index');
        } catch (e) {
          console.log('ℹ️ City index creation skipped:', e.message);
        }
      } else {
        console.log('ℹ️ City index already exists, skipping...');
      }

      if (!indexNames.includes('idx_restaurants_postal')) {
        try {
          await queryInterface.addIndex('restaurants', ['postal_code'], {
            name: 'idx_restaurants_postal'
          });
          console.log('✅ Added postal code index');
        } catch (e) {
          console.log('ℹ️ Postal index creation skipped:', e.message);
        }
      } else {
        console.log('ℹ️ Postal index already exists, skipping...');
      }

      console.log('🎉 GPS migration completed successfully!');
      
    } catch (error) {
      console.error('❌ GPS migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🗑️ Removing GPS fields from restaurants table...');
    
    try {
      // Get existing columns
      const tableDescription = await queryInterface.describeTable('restaurants');
      const existingColumns = Object.keys(tableDescription);

      // Get existing indexes
      const indexes = await queryInterface.showIndex('restaurants');
      const indexNames = indexes.map(idx => idx.name);

      // Remove indexes first (safe mode)
      if (indexNames.includes('idx_restaurants_gps_coords')) {
        try {
          await queryInterface.removeIndex('restaurants', 'idx_restaurants_gps_coords');
          console.log('🗑️ Removed GPS index');
        } catch (e) {
          console.log('ℹ️ GPS index removal failed:', e.message);
        }
      }

      if (indexNames.includes('idx_restaurants_city')) {
        try {
          await queryInterface.removeIndex('restaurants', 'idx_restaurants_city');
          console.log('🗑️ Removed city index');
        } catch (e) {
          console.log('ℹ️ City index removal failed:', e.message);
        }
      }

      if (indexNames.includes('idx_restaurants_postal')) {
        try {
          await queryInterface.removeIndex('restaurants', 'idx_restaurants_postal');
          console.log('🗑️ Removed postal index');
        } catch (e) {
          console.log('ℹ️ Postal index removal failed:', e.message);
        }
      }

      // Remove columns (safe mode)
      if (existingColumns.includes('longitude')) {
        await queryInterface.removeColumn('restaurants', 'longitude');
        console.log('🗑️ Removed longitude column');
      }
      
      if (existingColumns.includes('latitude')) {
        await queryInterface.removeColumn('restaurants', 'latitude');
        console.log('🗑️ Removed latitude column');
      }
      
      if (existingColumns.includes('postal_code')) {
        await queryInterface.removeColumn('restaurants', 'postal_code');
        console.log('🗑️ Removed postal_code column');
      }
      
      // Keep city column as it might be used elsewhere
      
      console.log('✅ GPS migration rollback completed');
      
    } catch (error) {
      console.error('❌ GPS migration rollback failed:', error);
      throw error;
    }
  }
};