// create-test-user.js
// Führe das aus um einen Test-User zu erstellen: node create-test-user.js

const bcrypt = require('bcryptjs');

async function createTestUser() {
  console.log('👤 ERSTELLE TEST-USER...\n');
  
  try {
    // Models laden (jetzt funktionieren sie!)
    const { User, Restaurant, sequelize } = require('./src/models');
    
    // Warte bis Models geladen sind
    await sequelize.authenticate();
    console.log('✅ Database verbunden');
    
    // Test ob User Model funktioniert
    if (!User || !User.findOne) {
      throw new Error('User Model nicht verfügbar');
    }
    console.log('✅ User Model verfügbar');
    
    // Erstelle Passwort-Hash für "password123"
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('✅ Passwort gehashed:', password, '→', hashedPassword.substring(0, 20) + '...');
    
    // Prüfe ob Restaurant existiert
    let restaurant = await Restaurant.findOne();
    if (!restaurant) {
      console.log('⚠️ Kein Restaurant gefunden, erstelle Test-Restaurant...');
      restaurant = await Restaurant.create({
        tenantId: 'test-tenant-123',
        name: 'Test Restaurant',
        subscriptionPlan: 'Pro',
        isActive: true
      });
      console.log('✅ Test-Restaurant erstellt:', restaurant.id);
    } else {
      console.log('✅ Restaurant gefunden:', restaurant.name, restaurant.id);
    }
    
    // Lösche alten User falls vorhanden
    const existingUser = await User.findOne({ where: { email: 'admin@restaurant.com' } });
    if (existingUser) {
      await existingUser.destroy();
      console.log('🗑️ Alter User gelöscht');
    }
    
    // Erstelle neuen Test-User
    const newUser = await User.create({
      email: 'admin@restaurant.com',
      password: hashedPassword,
      name: 'Admin Test User',
      role: 'admin',
      uiLanguage: 'de',
      isActive: true,
      restaurantId: restaurant.id
    });
    
    console.log('🎉 TEST-USER ERFOLGREICH ERSTELLT!');
    console.log('📋 Login-Daten:');
    console.log('   Email:', newUser.email);
    console.log('   Passwort:', password);
    console.log('   Restaurant:', restaurant.name);
    console.log('   User ID:', newUser.id);
    
    // Test-Login
    console.log('\n🧪 TESTE PASSWORT-VERGLEICH...');
    const testComparison = await bcrypt.compare(password, newUser.password);
    console.log('   bcrypt.compare() Ergebnis:', testComparison ? '✅ OK' : '❌ FEHLER');
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Fehler:', error.message);
    console.error('📍 Stack:', error.stack);
    process.exit(1);
  }
}

createTestUser();