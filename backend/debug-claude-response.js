// 🚨 EMERGENCY DEBUG: Claude AI Response Inspector (FIXED)
// debug-claude-response.js

require('dotenv').config();

const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ==========================================
// RAW CLAUDE CALL (Minimal Test)
// ==========================================
async function debugClaudeRawResponse() {
  console.log('🔍 DEBUGGING CLAUDE AI RAW RESPONSE\n');
  
  // Check API Key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log('🔑 API Key Status: ' + (apiKey ? 'EXISTS' : 'MISSING'));
  
  if (!apiKey) {
    console.log('❌ No API key found in .env file!');
    console.log('💡 Add this to your .env file: ANTHROPIC_API_KEY=sk-ant-your-key');
    return;
  }
  
  if (!apiKey.startsWith('sk-ant-')) {
    console.log('❌ Invalid API key format! Must start with sk-ant-');
    return;
  }
  
  console.log('🔑 API Key: sk-ant-****' + apiKey.slice(-4));
  console.log('✅ API Key format looks correct\n');

  // Simple prompt for Pizza Margherita
  const prompt = `Erstelle ein deutsches Rezept für "Pizza Margherita".

WICHTIG: Antworte NUR mit einem validen JSON-Objekt in diesem Format:

{
  "name": "Pizza Margherita",
  "description": "Klassische italienische Pizza mit Tomate, Mozzarella und Basilikum",
  "instructions": ["Schritt 1", "Schritt 2", "Schritt 3"],
  "prepTime": 30,
  "cookTime": 15,
  "servings": 4,
  "difficulty": "medium",
  "cuisine": "italian", 
  "language": "de",
  "ingredients": [
    {"name": "Mehl", "quantity": 400, "unit": "g", "pricePerUnit": 0.002},
    {"name": "Tomatensauce", "quantity": 200, "unit": "ml", "pricePerUnit": 0.01}
  ],
  "nutrition": {"calories": 290, "protein": 12, "fat": 8, "carbs": 35, "fiber": 3},
  "tags": ["italienisch", "vegetarisch"]
}

Antworte NUR mit dem JSON - keine Erklärungen!`;

  try {
    console.log('🤖 Calling Claude API...\n');
    
    const startTime = Date.now();
    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20241022',
      max_tokens: 2000,
      temperature: 0.5,
      system: 'Du bist ein Koch. Antworte nur mit validem JSON ohne Erklärungen.',
      messages: [{
        role: 'user', 
        content: prompt
      }]
    });
    
    const duration = Date.now() - startTime;
    console.log('✅ API call successful (' + duration + 'ms)\n');

    // Extract response text
    const responseText = message.content[0]?.text;
    
    if (!responseText) {
      console.log('❌ No response text received from Claude!');
      console.log('📄 Full response object:', JSON.stringify(message, null, 2));
      return;
    }

    console.log('📥 RAW CLAUDE RESPONSE:');
    console.log('='.repeat(80));
    console.log(responseText);
    console.log('='.repeat(80));
    console.log('');

    // Analyze the response
    console.log('🔍 RESPONSE ANALYSIS:');
    console.log('📏 Length: ' + responseText.length + ' characters');
    console.log('🎯 Starts with: "' + responseText.substring(0, 50) + '..."');
    console.log('🎯 Ends with: "...' + responseText.slice(-50) + '"');
    console.log('📝 Contains "json": ' + responseText.includes('json'));
    console.log('📝 Contains "{": ' + responseText.includes('{'));
    console.log('📝 Contains "}": ' + responseText.includes('}'));
    console.log('📝 Contains triple-backticks: ' + responseText.includes('```'));
    console.log('');

    // Try to clean and parse JSON
    console.log('🧹 CLEANING JSON:');
    
    let cleanedResponse = responseText.trim();
    console.log('1. Trimmed: "' + cleanedResponse.substring(0, 50) + '..."');
    
    // Remove markdown code blocks
    cleanedResponse = cleanedResponse
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '');
    console.log('2. Markdown removed: "' + cleanedResponse.substring(0, 50) + '..."');
    
    // Find JSON object boundaries
    const firstBrace = cleanedResponse.indexOf('{');
    const lastBrace = cleanedResponse.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);
      console.log('3. JSON extracted: "' + cleanedResponse.substring(0, 50) + '..."');
    }
    
    console.log('');

    // Try to parse JSON
    console.log('🔧 PARSING JSON:');
    try {
      const parsedJSON = JSON.parse(cleanedResponse);
      console.log('✅ JSON parsing SUCCESSFUL!');
      console.log('');
      
      console.log('📋 PARSED RECIPE OBJECT:');
      console.log(JSON.stringify(parsedJSON, null, 2));
      console.log('');
      
      // Validate structure
      console.log('🔍 STRUCTURE VALIDATION:');
      const requiredFields = ['name', 'description', 'instructions', 'prepTime', 'cookTime', 'servings', 'difficulty', 'ingredients'];
      
      const missingFields = requiredFields.filter(field => !parsedJSON[field]);
      const invalidFields = [];
      
      if (missingFields.length === 0) {
        console.log('✅ All required fields present');
        
        // Check field types
        if (typeof parsedJSON.name !== 'string') invalidFields.push('name must be string');
        if (typeof parsedJSON.description !== 'string') invalidFields.push('description must be string');
        if (!Array.isArray(parsedJSON.instructions)) invalidFields.push('instructions must be array');
        if (typeof parsedJSON.prepTime !== 'number') invalidFields.push('prepTime must be number');
        if (typeof parsedJSON.cookTime !== 'number') invalidFields.push('cookTime must be number');
        if (typeof parsedJSON.servings !== 'number') invalidFields.push('servings must be number');
        if (!Array.isArray(parsedJSON.ingredients)) invalidFields.push('ingredients must be array');
        
        if (invalidFields.length === 0) {
          console.log('✅ All field types are correct');
          console.log('🎉 RECIPE STRUCTURE IS VALID!');
        } else {
          console.log('❌ Invalid field types:');
          invalidFields.forEach(error => console.log('   • ' + error));
        }
      } else {
        console.log('❌ Missing required fields:');
        missingFields.forEach(field => console.log('   • ' + field));
      }
      
    } catch (parseError) {
      console.log('❌ JSON parsing FAILED!');
      console.log('❌ Parse error: ' + parseError.message);
      console.log('');
      
      console.log('🔍 FIRST 300 CHARACTERS:');
      console.log(cleanedResponse.substring(0, 300));
      console.log('');
      
      console.log('🔍 CHARACTER-BY-CHARACTER ANALYSIS (first 200 chars):');
      for (let i = 0; i < Math.min(cleanedResponse.length, 200); i++) {
        const char = cleanedResponse[i];
        const code = char.charCodeAt(0);
        if (code < 32 || code > 126) {
          console.log('❌ Invalid character at position ' + i + ': "' + char + '" (code: ' + code + ')');
        }
      }
    }

  } catch (apiError) {
    console.log('💥 API CALL FAILED!');
    console.log('❌ Error: ' + apiError.message);
    console.log('❌ Type: ' + apiError.name);
    
    if (apiError.response) {
      console.log('❌ Status: ' + apiError.response.status);
      console.log('❌ Response: ' + JSON.stringify(apiError.response.data, null, 2));
    }
  }
}

// ==========================================
// CHECK YOUR CURRENT SERVICE
// ==========================================
async function checkCurrentService() {
  console.log('🔍 CHECKING YOUR CURRENT CLAUDE SERVICE\n');
  
  try {
    const claudeAIService = require('./services/claudeAIService');
    console.log('✅ Claude service loaded successfully');
    
    // Check if it has the methods we expect
    const methods = ['generateRecipe', 'validateRecipeStructure'];
    methods.forEach(method => {
      if (typeof claudeAIService[method] === 'function') {
        console.log('✅ Method ' + method + ' exists');
      } else {
        console.log('❌ Method ' + method + ' MISSING or not a function');
      }
    });
    
    console.log('\n🧪 Testing service with simple call...');
    
    const result = await claudeAIService.generateRecipe({
      productName: 'Test Pizza',
      servings: 4,
      cuisine: 'italian',
      difficulty: 'medium',
      language: 'de'
    });
    
    console.log('📤 Service result:');
    console.log('   Success: ' + result.success);
    console.log('   Error: ' + (result.error || 'None'));
    
    if (result.rawResponse) {
      console.log('   Raw response length: ' + result.rawResponse.length);
      console.log('   Raw response preview: "' + result.rawResponse.substring(0, 100) + '..."');
    }
    
  } catch (error) {
    console.log('❌ Error loading Claude service: ' + error.message);
    console.log('💡 Make sure you have services/claudeAIService.js file');
  }
}

// ==========================================
// MAIN RUNNER
// ==========================================
const command = process.argv[2];

switch (command) {
  case 'raw':
    debugClaudeRawResponse();
    break;
  case 'service':
    checkCurrentService();
    break;
  case 'both':
    console.log('🔍 RUNNING COMPLETE DEBUG ANALYSIS\n');
    console.log('1️⃣ CHECKING CURRENT SERVICE:');
    console.log('='.repeat(50));
    checkCurrentService().then(() => {
      console.log('\n2️⃣ TESTING RAW CLAUDE CALL:');
      console.log('='.repeat(50)); 
      return debugClaudeRawResponse();
    });
    break;
  default:
    console.log(`
🚨 CLAUDE AI EMERGENCY DEBUGGER

Usage:
  node debug-claude-response.js raw      # Test raw Claude API call
  node debug-claude-response.js service  # Check your current service
  node debug-claude-response.js both     # Run complete analysis

Examples:
  node debug-claude-response.js raw      # Most useful for current issue
  node debug-claude-response.js both     # Complete debugging

Requirements:
  - Set ANTHROPIC_API_KEY in .env file
  - Make sure services/claudeAIService.js exists
`);
    break;
}