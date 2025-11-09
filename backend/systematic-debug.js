// systematic-debug.js
// Lege diese Datei in: backend/systematic-debug.js
// Ausführen mit: node systematic-debug.js

console.log('🔍 SYSTEMATISCHES DEBUGGING STARTET...\n');
console.log('=' + '='.repeat(50));

// SCHRITT 1: Datei-Struktur prüfen
console.log('\n📁 SCHRITT 1: DATEI-STRUKTUR PRÜFEN');
console.log('-'.repeat(30));

const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'src/models/index.js',
  'src/models/User.js', 
  'src/models/Restaurant.js',
  'src/config/database.js',
  'src/controllers/authController.js'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} existiert`);
  } else {
    console.log(`❌ ${file} FEHLT!`);
  }
});

// SCHRITT 2: Syntax-Check aller Modelle
console.log('\n🔧 SCHRITT 2: SYNTAX-CHECK DER MODELLE');
console.log('-'.repeat(30));

const modelFiles = ['src/models/User.js', 'src/models/Restaurant.js', 'src/models/index.js'];

modelFiles.forEach(file => {
  if (fs.existsSync(file)) {
    try {
      require('child_process').execSync(`node -c ${file}`, { stdio: 'pipe' });
      console.log(`✅ ${file} - Syntax OK`);
    } catch (error) {
      console.log(`❌ ${file} - SYNTAX FEHLER!`);
      console.log(`   Fehler: ${error.message}`);
    }
  }
});

// SCHRITT 3: Database Config prüfen
console.log('\n🗄️ SCHRITT 3: DATABASE CONFIG PRÜFEN');
console.log('-'.repeat(30));

try {
  const dbConfig = require('./src/config/database');
  console.log('✅ Database config geladen');
  
  // Test connection
  dbConfig.authenticate()
    .then(() => {
      console.log('✅ Database Verbindung erfolgreich');
      testModels();
    })
    .catch(err => {
      console.log('❌ Database Verbindung fehlgeschlagen:');
      console.log(`   ${err.message}`);
      console.log('\n💡 LÖSUNGSVORSCHLÄGE:');
      console.log('   - Ist dein MySQL/PostgreSQL Server gestartet?');
      console.log('   - Sind die Zugangsdaten in .env korrekt?');
      console.log('   - Existiert die Datenbank "restaurant_db"?');
    });
    
} catch (error) {
  console.log('❌ Database config konnte nicht geladen werden:');
  console.log(`   ${error.message}`);
}

// SCHRITT 4: Modelle laden und testen
function testModels() {
  console.log('\n🏗️ SCHRITT 4: MODELLE LADEN UND TESTEN');
  console.log('-'.repeat(30));
  
  try {
    const models = require('./src/models');
    console.log('✅ models/index.js geladen');
    
    // Welche Modelle sind verfügbar?
    const availableModels = Object.keys(models).filter(key => typeof models[key] === 'function');
    console.log('📋 Verfügbare Modelle:', availableModels);
    
    // User Model Check
    if (models.User) {
      console.log('✅ User Model geladen');
      if (typeof models.User.findOne === 'function') {
        console.log('✅ User.findOne() verfügbar');
      } else {
        console.log('❌ User.findOne() NICHT verfügbar');
      }
    } else {
      console.log('❌ User Model NICHT geladen');
    }
    
    // Restaurant Model Check  
    if (models.Restaurant) {
      console.log('✅ Restaurant Model geladen');
    } else {
      console.log('❌ Restaurant Model NICHT geladen');
    }
    
    // Test eine einfache Query
    if (models.User && models.User.findOne) {
      console.log('\n🧪 SCHRITT 5: TEST-QUERY');
      console.log('-'.repeat(30));
      
      models.User.findOne({ where: { email: 'test@test.com' } })
        .then(result => {
          console.log('✅ User.findOne() Query erfolgreich');
          console.log('🎉 ALLES FUNKTIONIERT! Das Problem liegt woanders.');
        })
        .catch(error => {
          console.log('❌ User.findOne() Query fehlgeschlagen:');
          console.log(`   ${error.message}`);
          
          if (error.message.includes('Table') && error.message.includes("doesn't exist")) {
            console.log('\n💡 LÖSUNG: Tabellen fehlen in der Datenbank!');
            console.log('   Führe aus: npm run db:migrate oder npm run db:sync');
          }
        });
    }
    
  } catch (error) {
    console.log('❌ Modelle konnten nicht geladen werden:');
    console.log(`   ${error.message}`);
    console.log('\n📍 Stack Trace:');
    console.log(error.stack);
  }
}

console.log('\n🔍 DEBUGGING SCRIPT GESTARTET...');