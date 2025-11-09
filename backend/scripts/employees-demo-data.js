// backend/src/seeders/employees-demo-data.js
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const restaurantId = 'your-restaurant-id'; // Ihre Restaurant ID

    await queryInterface.bulkInsert('employees', [
      {
        id: Sequelize.fn('uuid_generate_v4'),
        first_name: 'Max',
        last_name: 'Mustermann',
        email: 'max@restaurant.com',
        phone: '+49123456789',
        restaurant_id: restaurantId,
        position: 'chef',
        department: 'kitchen',
        employment_type: 'fulltime',
        hourly_wage: 18.50,
        max_hours_per_week: 40,
        availability: {
          monday: { start: '06:00', end: '22:00', available: true },
          tuesday: { start: '06:00', end: '22:00', available: true },
          wednesday: { start: '06:00', end: '22:00', available: true },
          thursday: { start: '06:00', end: '22:00', available: true },
          friday: { start: '06:00', end: '22:00', available: true },
          saturday: { start: '08:00', end: '24:00', available: true },
          sunday: { start: '10:00', end: '22:00', available: false }
        },
        preferences: {
          preferredShifts: ['morning', 'afternoon'],
          avoidLateNights: true,
          weekendWork: 'limited'
        },
        skill_level: 9,
        certifications: ['food_safety', 'advanced_cooking'],
        performance_score: 8.5,
        reliability_score: 9.2,
        hire_date: '2023-01-15',
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        id: Sequelize.fn('uuid_generate_v4'),
        first_name: 'Anna',
        last_name: 'Schmidt',
        email: 'anna@restaurant.com',
        phone: '+49987654321',
        restaurant_id: restaurantId,
        position: 'waiter',
        department: 'service',
        employment_type: 'parttime',
        hourly_wage: 12.50,
        max_hours_per_week: 25,
        availability: {
          monday: { available: false },
          tuesday: { available: false },
          wednesday: { start: '16:00', end: '23:00', available: true },
          thursday: { start: '16:00', end: '23:00', available: true },
          friday: { start: '16:00', end: '24:00', available: true },
          saturday: { start: '10:00', end: '24:00', available: true },
          sunday: { start: '10:00', end: '22:00', available: true }
        },
        preferences: {
          preferredShifts: ['evening'],
          studentSchedule: true,
          flexibleWeekends: true
        },
        skill_level: 6,
        certifications: ['customer_service'],
        performance_score: 7.8,
        reliability_score: 8.1,
        hire_date: '2024-03-20',
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.bulkDelete('employees', null, {});
  }
};