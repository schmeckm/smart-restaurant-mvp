// startup-fixed.js
// LÖSUNG FÜR DAS TIMING-PROBLEM
// Ersetze den Server-Start in deiner app.js/server.js mit diesem Code:

const express = require('express');

async function startServer() {
  console.log('🚀 SERVER STARTUP - RICHTIGE REIHENFOLGE...');
  
  try {
    // SCHRITT 1: Database Connection warten
    console.log('1️⃣ Database Connection...');
    const sequelize = require('./src/config/database');
    await sequelize.authenticate();
    console.log('✅ Database verbunden');
    
    // SCHRITT 2: Models laden und WARTEN bis fertig
    console.log('2️⃣ Models laden...');
    const models = require('./src/models');
    
    // WARTEN bis Models wirklich da sind
    let attempts = 0;
    const maxAttempts = 10;
    
    while ((!models.User || !models.Restaurant) && attempts < maxAttempts) {
      console.log(`   Warte auf Models... Versuch ${attempts + 1}`);
      await new Promise(resolve => setTimeout(resolve, 100)); // 100ms warten
      attempts++;
    }
    
    if (!models.User || !models.Restaurant) {
      throw new Error('❌ Models konnten nicht geladen werden nach ' + maxAttempts + ' Versuchen');
    }
    
    console.log('✅ Models erfolgreich geladen:', Object.keys(models).filter(key => typeof models[key] === 'function'));
    
    // SCHRITT 3: Express App erstellen (nach Model-Loading)
    console.log('3️⃣ Express App starten...');
    const app = express();
    
    // Deine Express-Konfiguration hier...
    app.use(express.json());
    
    // Routes laden (NACH Model-Loading!)
    app.use('/api/v1/auth', require('./src/routes/authRoutes'));
    // ... andere Routes
    
    // SCHRITT 4: Server starten
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log('✅ Server läuft auf Port', PORT);
      console.log('🎉 ALLE MODELS GELADEN - READY FOR REQUESTS!');
    });
    
  } catch (error) {
    console.error('❌ Server Start Fehler:', error.message);
    process.exit(1);
  }
}

// App starten
startServer();

module.exports = { startServer };