'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('📞 Adding phone column to users table (safe mode)...');

    try {
      // Prüfen, ob Tabelle existiert
      const tables = await queryInterface.showAllTables();
      if (!tables.includes('users')) {
        throw new Error('❌ Users table does not exist');
      }

      console.log('✅ Users table found');

      // Prüfen, welche Spalten schon existieren
      const tableDescription = await queryInterface.describeTable('users');
      const existingColumns = Object.keys(tableDescription);
      console.log('🔍 Existing columns:', existingColumns.join(', '));

      // phone-Spalte nur hinzufügen, wenn sie fehlt
      if (!existingColumns.includes('phone')) {
        await queryInterface.addColumn('users', 'phone', {
          type: Sequelize.STRING(30),
          allowNull: true,
          comment: 'Telefonnummer des Benutzers'
        });
        console.log('✅ Added phone column');
      } else {
        console.log('ℹ️ Phone column already exists, skipping...');
      }

      // Optional: Index für schnellere Suche
      const indexes = await queryInterface.showIndex('users');
      const indexNames = indexes.map(i => i.name);
      if (!indexNames.includes('idx_users_phone')) {
        try {
          await queryInterface.addIndex('users', ['phone'], { name: 'idx_users_phone' });
          console.log('✅ Added phone index');
        } catch (e) {
          console.log('ℹ️ Could not create phone index:', e.message);
        }
      } else {
        console.log('ℹ️ Phone index already exists, skipping...');
      }

      console.log('🎉 Phone migration completed successfully!');
    } catch (error) {
      console.error('❌ Phone migration failed:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.log('🗑️ Removing phone column from users table (safe mode)...');

    try {
      const tableDescription = await queryInterface.describeTable('users');
      const existingColumns = Object.keys(tableDescription);

      const indexes = await queryInterface.showIndex('users');
      const indexNames = indexes.map(i => i.name);

      if (indexNames.includes('idx_users_phone')) {
        await queryInterface.removeIndex('users', 'idx_users_phone');
        console.log('🗑️ Removed phone index');
      }

      if (existingColumns.includes('phone')) {
        await queryInterface.removeColumn('users', 'phone');
        console.log('🗑️ Removed phone column');
      } else {
        console.log('ℹ️ Phone column not found, skipping...');
      }

      console.log('✅ Phone migration rollback completed');
    } catch (error) {
      console.error('❌ Phone migration rollback failed:', error);
      throw error;
    }
  }
};
