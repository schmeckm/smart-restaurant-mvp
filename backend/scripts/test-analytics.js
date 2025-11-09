const axios = require('axios');

const baseURL = 'http://localhost:3000/api/v1';
const token = 'YOUR_TOKEN_HERE'; // Ihr echtes Token einfügen

const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};

async function testAnalyticsEndpoints() {
  console.log('🧪 Testing Analytics Endpoints...\n');

  // Test 1: Today Analytics
  try {
    console.log('1️⃣ Testing /analytics/today');
    const response = await axios.get(`${baseURL}/analytics/today`, { headers });
    console.log('✅ SUCCESS:', response.status);
    console.log('📊 Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ FAILED:', error.response?.status, error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 2: Daily Sales
  try {
    console.log('2️⃣ Testing /analytics/daily');
    const response = await axios.get(`${baseURL}/analytics/daily?startDate=2025-10-25&endDate=2025-11-01`, { headers });
    console.log('✅ SUCCESS:', response.status);
    console.log('📈 Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ FAILED:', error.response?.status, error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 3: Top Products
  try {
    console.log('3️⃣ Testing /analytics/top-products');
    const response = await axios.get(`${baseURL}/analytics/top-products`, { headers });
    console.log('✅ SUCCESS:', response.status);
    console.log('🏆 Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ FAILED:', error.response?.status, error.response?.data || error.message);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test 4: Low Stock
  try {
    console.log('4️⃣ Testing /analytics/low-stock');
    const response = await axios.get(`${baseURL}/analytics/low-stock`, { headers });
    console.log('✅ SUCCESS:', response.status);
    console.log('📦 Data:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.log('❌ FAILED:', error.response?.status, error.response?.data || error.message);
  }
}

// Token aus localStorage extrahieren (für Browser)
function getTokenFromBrowser() {
  console.log(`
🔑 Token aus Browser extrahieren:
1. Öffnen Sie http://localhost:8080 (Ihr Frontend)
2. Öffnen Sie Browser-Entwicklertools (F12)
3. Gehen Sie zu Console Tab
4. Geben Sie ein: localStorage.getItem('token')
5. Kopieren Sie den Token (ohne Anführungszeichen)
6. Ersetzen Sie 'YOUR_TOKEN_HERE' oben im Script
  `);
}

if (token === 'YOUR_TOKEN_HERE') {
  getTokenFromBrowser();
} else {
  testAnalyticsEndpoints();
}