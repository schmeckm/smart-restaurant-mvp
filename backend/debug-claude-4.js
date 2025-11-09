// 🚨 FIXED DEBUG: Using Claude 4 Sonnet
// debug-claude-4.js

require('dotenv').config();

const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ==========================================
// RAW CLAUDE 4 CALL
// ==========================================
async function debugClaude4Response() {
  console.log('🔍 DEBUGGING CLAUDE 4 SONNET\n');
  
  // Check API Key
  const apiKey = process.env.ANTHROPIC_API_KEY;
  console.log('🔑 API Key Status: ' + (apiKey ? 'EXISTS' : 'MISSING'));
  console.log('🔑 API Key: sk-ant-****' + apiKey.slice(-4));
  console.log('✅ Using Claude 4 Sonnet\n');

  // Optimized prompt for Claude 4
  const prompt = `Generate a German recipe for "Pizza Margherita".

Return ONLY a valid JSON object with this exact structure:

{
  "name": "Pizza Margherita",
  "description": "Classic Italian pizza with tomato, mozzarella and basil",
  "instructions": [
    "Step 1: Detailed instruction",
    "Step 2: Detailed instruction", 
    "Step 3: Detailed instruction"
  ],
  "prepTime": 30,
  "cookTime": 15,
  "servings": 4,
  "difficulty": "medium",
  "cuisine": "italian",
  "language": "de", 
  "ingredients": [
    {"name": "Flour", "quantity": 400, "unit": "g", "pricePerUnit": 0.002},
    {"name": "Tomato sauce", "quantity": 200, "unit": "ml", "pricePerUnit": 0.01},
    {"name": "Mozzarella", "quantity": 250, "unit": "g", "pricePerUnit": 0.02}
  ],
  "nutrition": {
    "calories": 290,
    "protein": 12,
    "fat": 8,
    "carbs": 35,
    "fiber": 3
  },
  "tags": ["italian", "vegetarian"]
}

Requirements:
- German ingredient names
- Realistic quantities and times  
- Detailed step-by-step instructions
- Valid JSON only - no explanations`;

  try {
    console.log('🤖 Calling Claude 4 API...\n');
    
    const startTime = Date.now();
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',  // ✅ WORKING MODEL
      max_tokens: 3000,
      temperature: 0.3,
      system: 'You are a professional chef. Return only valid JSON without any explanations or markdown.',
      messages: [{
        role: 'user', 
        content: prompt
      }]
    });
    
    const duration = Date.now() - startTime;
    console.log('✅ Claude 4 API call successful (' + duration + 'ms)\n');

    // Extract response text
    const responseText = message.content[0]?.text;
    
    if (!responseText) {
      console.log('❌ No response text received!');
      return;
    }

    console.log('📥 RAW CLAUDE 4 RESPONSE:');
    console.log('='.repeat(80));
    console.log(responseText);
    console.log('='.repeat(80));
    console.log('');

    // Analyze the response
    console.log('🔍 RESPONSE ANALYSIS:');
    console.log('📏 Length: ' + responseText.length + ' characters');
    console.log('🎯 Starts with: "' + responseText.substring(0, 30) + '..."');
    console.log('🎯 Ends with: "...' + responseText.slice(-30) + '"');
    console.log('📝 Contains "{": ' + responseText.includes('{'));
    console.log('📝 Contains "}": ' + responseText.includes('}'));
    console.log('📝 Contains markdown: ' + responseText.includes('```'));
    console.log('');

    // Clean JSON
    console.log('🧹 CLEANING JSON:');
    
    let cleanedResponse = responseText.trim();
    
    // Remove any markdown
    cleanedResponse = cleanedResponse
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '');
    
    // Extract JSON object
    const firstBrace = cleanedResponse.indexOf('{');
    const lastBrace = cleanedResponse.lastIndexOf('}');
    
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);
    }
    
    console.log('Cleaned JSON preview: "' + cleanedResponse.substring(0, 100) + '..."');
    console.log('');

    // Parse JSON
    console.log('🔧 PARSING JSON:');
    try {
      const recipe = JSON.parse(cleanedResponse);
      console.log('✅ JSON parsing SUCCESSFUL!');
      console.log('');
      
      console.log('📋 RECIPE SUMMARY:');
      console.log('Name: ' + recipe.name);
      console.log('Description: ' + recipe.description);
      console.log('Servings: ' + recipe.servings);
      console.log('Prep: ' + recipe.prepTime + 'min, Cook: ' + recipe.cookTime + 'min');
      console.log('Difficulty: ' + recipe.difficulty);
      console.log('Ingredients: ' + (recipe.ingredients?.length || 0) + ' items');
      console.log('Instructions: ' + (recipe.instructions?.length || 0) + ' steps');
      console.log('');
      
      // Validate structure
      console.log('🔍 STRUCTURE VALIDATION:');
      const requiredFields = ['name', 'description', 'instructions', 'prepTime', 'cookTime', 'servings', 'ingredients'];
      const missingFields = requiredFields.filter(field => !recipe[field]);
      
      if (missingFields.length === 0) {
        console.log('✅ All required fields present');
        
        // Type validation
        const typeErrors = [];
        if (typeof recipe.name !== 'string') typeErrors.push('name must be string');
        if (typeof recipe.prepTime !== 'number') typeErrors.push('prepTime must be number'); 
        if (!Array.isArray(recipe.instructions)) typeErrors.push('instructions must be array');
        if (!Array.isArray(recipe.ingredients)) typeErrors.push('ingredients must be array');
        
        if (typeErrors.length === 0) {
          console.log('✅ All field types correct');
          console.log('🎉 RECIPE STRUCTURE IS COMPLETELY VALID!');
          
          // Show full recipe
          console.log('\n📋 COMPLETE RECIPE:');
          console.log(JSON.stringify(recipe, null, 2));
          
        } else {
          console.log('❌ Type validation errors:');
          typeErrors.forEach(error => console.log('   • ' + error));
        }
      } else {
        console.log('❌ Missing fields: ' + missingFields.join(', '));
      }
      
    } catch (parseError) {
      console.log('❌ JSON parsing FAILED!');
      console.log('❌ Error: ' + parseError.message);
      console.log('');
      console.log('🔍 PROBLEMATIC CONTENT (first 500 chars):');
      console.log(cleanedResponse.substring(0, 500));
    }

  } catch (apiError) {
    console.log('💥 API CALL FAILED!');
    console.log('❌ Error: ' + apiError.message);
  }
}

// ==========================================
// RUN TEST
// ==========================================
debugClaude4Response();