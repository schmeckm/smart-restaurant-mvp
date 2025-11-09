'use strict';

const { v4: uuidv4 } = require('uuid');

module.exports = {
  async up(queryInterface) {
    console.log('🚀 Seeding Demo-Tenants & Restaurants gestartet...');

    // Prüfe ob tenants existieren
    const [tenantTables] = await queryInterface.sequelize.query(`
      SELECT table_name FROM information_schema.tables WHERE table_name = 'tenants';
    `);

    let tenants = [];
    if (tenantTables.length) {
      tenants = [
        {
          id: '292809b8-d76c-4165-a58e-8fe692c94841',
          name: 'Demo Tenant GmbH',
          contact_email: 'info@demo-tenant.ch',
          contact_phone: '+41 44 123 45 67',
          billing_address: 'Bahnhofstrasse 1, 8001 Zürich',
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: '20f88ce1-9a56-4855-9b92-f488cce1b130',
          name: 'Premium Tenant AG',
          contact_email: 'contact@premium-tenant.ch',
          contact_phone: '+41 31 222 22 22',
          billing_address: 'Bundesplatz 7, 3011 Bern',
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];
      await queryInterface.bulkInsert('tenants', tenants, {});
      console.log('✅ Tenants eingefügt.');
    } else {
      console.warn('⚠️ Keine tenants-Tabelle gefunden – Restaurants werden trotzdem angelegt.');
    }

    // Mehr Restaurants
    const restaurants = [
      // Tenant 1 – Demo Tenant GmbH
      {
        id: uuidv4(),
        tenant_id: tenants[0]?.id || '00000000-0000-0000-0000-000000000000',
        name: 'Beizli zum Löwen',
        type: 'Beizli',
        address: 'Hauptstrasse 12, 4000 Basel',
        email: 'info@beizli-loewen.ch',
        phone: '+41 61 123 45 67',
        subscription_plan: 'Free',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        tenant_id: tenants[0]?.id || '00000000-0000-0000-0000-000000000000',
        name: 'Pizzeria da Marco',
        type: 'Pizzeria',
        address: 'Bahnhofstrasse 22, 8001 Zürich',
        email: 'kontakt@pizzeria-marco.ch',
        phone: '+41 44 456 78 90',
        subscription_plan: 'Fux',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        tenant_id: tenants[0]?.id || '00000000-0000-0000-0000-000000000000',
        name: 'Taverna Mykonos',
        type: 'Grieche',
        address: 'Poststrasse 10, 9000 St. Gallen',
        email: 'info@taverna-mykonos.ch',
        phone: '+41 71 333 22 11',
        subscription_plan: 'Pro',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        tenant_id: tenants[0]?.id || '00000000-0000-0000-0000-000000000000',
        name: 'Asia Imbiss Lotus',
        type: 'Imbiss',
        address: 'Steinentorstrasse 50, 4051 Basel',
        email: 'lotus@imbiss.ch',
        phone: '+41 61 222 33 11',
        subscription_plan: 'Free',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },

      // Tenant 2 – Premium Tenant AG
      {
        id: uuidv4(),
        tenant_id: tenants[1]?.id || '00000000-0000-0000-0000-000000000000',
        name: 'Bergwirtschaft Alpenblick',
        type: 'Bergwirtschaft',
        address: 'Bergweg 3, 3800 Interlaken',
        email: 'alpenblick@mountain.ch',
        phone: '+41 33 987 65 43',
        subscription_plan: 'Enterprise',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        tenant_id: tenants[1]?.id || '00000000-0000-0000-0000-000000000000',
        name: 'Steakhouse Matterhorn',
        type: 'FineDining',
        address: 'Höhenstrasse 2, 3920 Zermatt',
        email: 'info@steakhouse-matterhorn.ch',
        phone: '+41 27 777 77 77',
        subscription_plan: 'Enterprise',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: uuidv4(),
        tenant_id: tenants[1]?.id || '00000000-0000-0000-0000-000000000000',
        name: 'VeggieCorner',
        type: 'Beizli',
        address: 'Limmatquai 70, 8001 Zürich',
        email: 'contact@veggiecorner.ch',
        phone: '+41 44 123 99 88',
        subscription_plan: 'SuccessBased',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    await queryInterface.bulkInsert('restaurants', restaurants, {});
    console.log(`✅ ${restaurants.length} Restaurants erfolgreich eingefügt.`);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('restaurants', null, {});
    await queryInterface.bulkDelete('tenants', null, {});
  },
};
