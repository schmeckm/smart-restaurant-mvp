/**
 * @swagger
 * tags:
 *   name: AI Recipes
 *   description: KI-gestützte Rezepterstellung und -verwaltung
 */

/**
 * @swagger
 * /api/v1/recipes/generate-with-ai:
 *   post:
 *     summary: Generiert ein Rezept mit KI (Claude 4 AI oder Fallback Template)
 *     tags: [AI Recipes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *                 description: Optional – ID eines bestehenden Produkts
 *               productName:
 *                 type: string
 *               description:
 *                 type: string
 *               servings:
 *                 type: integer
 *                 default: 4
 *               cuisine:
 *                 type: string
 *                 example: "italian"
 *               difficulty:
 *                 type: string
 *                 example: "medium"
 *               language:
 *                 type: string
 *                 example: "de"
 *               dietaryRestrictions:
 *                 type: array
 *                 items:
 *                   type: string
 *               customInstructions:
 *                 type: string
 *     responses:
 *       200:
 *         description: Erfolgreich generiertes Rezept
 *       400:
 *         description: Fehlende Eingaben
 *       500:
 *         description: Interner Serverfehler
 */

const { Product, Ingredient, ProductIngredient, Category, sequelize } = require('../models');

// ==========================================
// DIFFICULTY MAPPING (German → English)
// ==========================================
const DIFFICULTY_MAPPING = {
  'Einfach': 'easy', 'Mittel': 'medium', 'Schwer': 'hard',
  'einfach': 'easy', 'mittel': 'medium', 'schwer': 'hard',
  'easy': 'easy', 'medium': 'medium', 'hard': 'hard'
};

// ==========================================
// MAIN AI RECIPE GENERATOR (Updated for Claude 4)
// ==========================================
exports.generateRecipeWithAI = async (req, res) => {
  try {
    const { 
      productId, 
      productName, 
      description, 
      servings = 4,
      cuisine = 'international', 
      difficulty = 'medium', 
      language = 'de',
      dietaryRestrictions = [], 
      customInstructions = '' 
    } = req.body;

    // Validation
    if (!productId && !productName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Product ID oder Name erforderlich' 
      });
    }

    // Get product if ID provided
    let product;
    if (productId) {
      product = await Product.findOne({
        where: { id: productId, restaurantId: req.user.restaurantId },
        include: [{ model: Category, as: 'category' }]
      });
      
      if (!product) {
        return res.status(404).json({ 
          success: false, 
          message: 'Produkt nicht gefunden' 
        });
      }
    }

    const finalName = product?.name || productName;
    const desc = product?.description || description || '';

    console.log(`🤖 Generating Claude 4 AI recipe for: "${finalName}"`);
    console.log(`📋 Parameters: ${servings} servings, ${difficulty} difficulty, ${language} language`);

    // Check Claude AI API Key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      console.log('⚠️ No valid Claude AI key found, using template fallback');
      return generateEnhancedTemplate(req, res, finalName, servings, cuisine, difficulty, language);
    }

    // 🚀 GET CLAUDE MODEL FROM ENV (with fallback)
    const claudeModel = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
    console.log(`🤖 Using Claude Model: ${claudeModel}`);

    // 🚀 DIRECT CLAUDE 4 API CALL (No external service needed)
    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: apiKey
    });

    // 🔧 ENHANCED PROMPT for Claude 4
    const prompt = `Du bist ein professioneller Restaurant-Koch. Erstelle ein detailliertes Rezept für "${finalName}".

Anforderungen:
- Portionen: ${servings}
- Küche: ${cuisine}
- Schwierigkeit: ${difficulty}
- Sprache: Deutsch${dietaryRestrictions.length > 0 ? `\n- Diät-Einschränkungen: ${dietaryRestrictions.join(', ')}` : ''}${customInstructions ? `\n- Spezielle Anweisungen: ${customInstructions}` : ''}

WICHTIG: Gib die Antwort als valides JSON zurück (ohne Markdown, ohne Backticks) mit dieser exakten Struktur:

{
  "name": "${finalName}",
  "description": "Kurze, appetitliche Beschreibung des Gerichts (1-2 Sätze)",
  "servings": ${servings},
  "prepTime": 30,
  "cookTime": 45,
  "difficulty": "${difficulty}",
  "cuisine": "${cuisine}",
  "language": "${language}",
  "ingredients": [
    {
      "name": "Deutsche Zutatennamen verwenden",
      "quantity": 200,
      "unit": "g",
      "pricePerUnit": 0.01,
      "notes": "Optional: Besondere Hinweise"
    }
  ],
  "instructions": [
    "Schritt 1: Sehr detaillierte Anleitung mit Temperaturen und Zeiten",
    "Schritt 2: Nächster detaillierter Schritt mit Profi-Tipps", 
    "Schritt 3: Finale Schritte für perfekte Präsentation"
  ],
  "nutrition": {
    "calories": 450,
    "protein": 25,
    "carbs": 40,
    "fat": 15,
    "fiber": 5
  },
  "tags": ["${cuisine}", "${difficulty}", "hausgemacht"]
}

Regeln:
- Deutsche Zutatenname verwenden
- Realistische Mengen für ${servings} Portionen
- Professionelle Restaurant-Qualität
- Mindestens 3 detaillierte Zubereitungsschritte
- Präzise Temperaturen und Garzeiten angeben`;

    const startTime = Date.now();

    // 🚀 CLAUDE 4 API CALL
    const message = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS) || 3000,
      temperature: parseFloat(process.env.CLAUDE_TEMPERATURE) || 0.7,
      system: 'Du bist ein Profi-Koch. Antworte nur mit validem JSON ohne Erklärungen oder Markdown.',
      messages: [{
        role: "user",
        content: prompt
      }]
    });

    const duration = Date.now() - startTime;
    const responseText = message.content[0]?.text;
    
    if (!responseText) {
      throw new Error('Keine Antwort von Claude AI erhalten');
    }

    console.log(`🤖 Claude 4 response received (${duration}ms, ${responseText.length} chars)`);
    console.log('🤖 Response preview:', responseText.substring(0, 150) + '...');

    // 🔧 ENHANCED JSON EXTRACTION
    let recipeData;
    try {
      // Clean response from potential markdown
      let cleanedResponse = responseText.trim();
      
      // Remove code blocks if present
      cleanedResponse = cleanedResponse
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '');
      
      // Extract JSON object boundaries
      const firstBrace = cleanedResponse.indexOf('{');
      const lastBrace = cleanedResponse.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        cleanedResponse = cleanedResponse.substring(firstBrace, lastBrace + 1);
      }
      
      recipeData = JSON.parse(cleanedResponse);
      
      // ✅ VALIDATE REQUIRED FIELDS
      const requiredFields = ['name', 'description', 'ingredients', 'instructions', 'prepTime', 'cookTime', 'servings'];
      const missingFields = requiredFields.filter(field => !recipeData[field]);
      
      if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }

      // ✅ VALIDATE FIELD TYPES
      const typeErrors = [];
      if (typeof recipeData.name !== 'string') typeErrors.push('name must be string');
      if (typeof recipeData.description !== 'string') typeErrors.push('description must be string');
      if (!Array.isArray(recipeData.instructions)) typeErrors.push('instructions must be array');
      if (!Array.isArray(recipeData.ingredients)) typeErrors.push('ingredients must be array');
      if (typeof recipeData.prepTime !== 'number') typeErrors.push('prepTime must be number');
      if (typeof recipeData.cookTime !== 'number') typeErrors.push('cookTime must be number');
      if (typeof recipeData.servings !== 'number') typeErrors.push('servings must be number');

      if (typeErrors.length > 0) {
        throw new Error(`Type validation errors: ${typeErrors.join(', ')}`);
      }
      
      // 🚀 ADD METADATA
      recipeData.generatedBy = `claude-ai-${claudeModel}`;
      recipeData.generatedAt = new Date().toISOString();
      recipeData.requestedServings = servings;
      recipeData.processingTime = duration;
      
      console.log('✅ Recipe generated and validated successfully!');
      
    } catch (parseError) {
      console.error('❌ JSON Parse/Validation Error:', parseError.message);
      console.error('❌ Raw Response (first 500 chars):', responseText.substring(0, 500));
      
      // Return to enhanced template fallback
      console.log('⚠️ Falling back to enhanced template generation');
      return generateEnhancedTemplate(req, res, finalName, servings, cuisine, difficulty, language);
    }

    // 🎉 SUCCESS RESPONSE
    res.json({
      success: true,
      message: `Recipe generated with ${claudeModel} in ${language.toUpperCase()}`,
      data: {
        ...recipeData,
        // Add extra metadata
        restaurantId: req.user?.restaurantId,
        requestedBy: req.user?.id,
        originalProductId: productId || null,
        generationMethod: `claude-ai-${claudeModel}`
      },
      meta: {
        model: claudeModel,
        processingTime: duration,
        responseLength: responseText.length,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Critical error in generateRecipeWithAI:', error);
    
    // Fallback to template generation on any critical error
    const finalName = req.body.productName || 'Unknown Dish';
    const { servings = 4, cuisine = 'international', difficulty = 'medium', language = 'de' } = req.body;
    
    console.log('⚠️ Critical error - falling back to template generation');
    return generateEnhancedTemplate(req, res, finalName, servings, cuisine, difficulty, language);
  }
};

// ==========================================
// ENHANCED TEMPLATE GENERATOR (Better Fallback)
// ==========================================
function generateEnhancedTemplate(req, res, productName, servings, cuisine, difficulty, language) {
  console.log(`📄 Generating ENHANCED template for: ${productName}`);
  
  try {
    const recipe = {
      name: getEnhancedName(productName, cuisine, language),
      description: getEnhancedDescription(productName, cuisine, language),
      instructions: getEnhancedInstructions(productName, difficulty, language),
      prepTime: getSmartPrepTime(productName),
      cookTime: getSmartCookTime(productName),
      servings,
      difficulty,
      cuisine,
      language,
      ingredients: getSmartIngredients(productName, servings, cuisine, language),
      nutrition: calculateSmartNutrition(productName, servings),
      tags: getSmartTags(productName, cuisine, difficulty),
      generatedBy: `enhanced-template-v3-${language}`,
      generatedAt: new Date().toISOString(),
      templateVersion: '3.0',
      fallbackReason: 'Claude AI unavailable or error occurred'
    };

    console.log('✅ Enhanced template recipe generated successfully!');
    
    res.json({
      success: true,
      message: `Recipe generated with ENHANCED template in ${language.toUpperCase()}`,
      data: recipe
    });
    
  } catch (error) {
    console.error('❌ Error generating template recipe:', error);
    
    res.status(500).json({
      success: false,
      message: 'Error generating template recipe',
      error: error.message
    });
  }
}

// ==========================================
// SMART TEMPLATE HELPER FUNCTIONS
// ==========================================

function getEnhancedName(name, cuisine, language) {
  const enhanced = {
    'pizza margherita': {
      de: 'Klassische Pizza Margherita',
      en: 'Classic Pizza Margherita'
    },
    'pasta carbonara': {
      de: 'Authentische Spaghetti Carbonara', 
      en: 'Authentic Pasta Carbonara'
    },
    'tiramisu': {
      de: 'Italienisches Tiramisu',
      en: 'Italian Tiramisu'
    }
  };
  
  const normalized = name.toLowerCase().trim();
  return enhanced[normalized]?.[language] || `${name} (${cuisine} Style)`;
}

function getEnhancedDescription(name, cuisine, language) {
  const templates = {
    de: {
      pizza: `Eine köstliche ${name} nach traditioneller italienischer Art mit frischen Zutaten`,
      pasta: `Authentische ${name} aus der italienischen Küche mit perfekt abgestimmten Zutaten`,
      dessert: `Ein verführerisches ${name} Dessert das jeden Gaumen verzaubert`,
      default: `Ein köstliches ${name} aus der ${cuisine} Küche mit authentischen Aromen`
    }
  };
  
  const normalized = name.toLowerCase();
  let category = 'default';
  
  if (normalized.includes('pizza')) category = 'pizza';
  else if (normalized.includes('pasta') || normalized.includes('spaghetti')) category = 'pasta'; 
  else if (normalized.includes('tiramisu') || normalized.includes('dessert')) category = 'dessert';
  
  return templates[language]?.[category] || templates.de.default;
}

function getEnhancedInstructions(name, difficulty, language) {
  const recipeDB = {
    'pizza margherita': {
      de: [
        "Pizzateig aus Mehl, Wasser, Hefe und Olivenöl kneten und 2 Stunden ruhen lassen",
        "Backofen samt Pizzastein auf 250°C vorheizen", 
        "Teig dünn ausrollen und mit Tomatensauce bestreichen",
        "Mozzarella in Scheiben schneiden und gleichmäßig verteilen",
        "Pizza 12-15 Minuten backen bis der Rand goldbraun ist",
        "Mit frischem Basilikum garnieren und sofort servieren"
      ]
    },
    'pasta carbonara': {
      de: [
        "Spaghetti in reichlich Salzwasser al dente kochen",
        "Speck in einer Pfanne ohne Öl knusprig braten", 
        "Eigelb mit geriebenem Parmesan und schwarzem Pfeffer verrühren",
        "Heißen, abgetropften Spaghetti zum Speck geben",
        "Ei-Käse-Mischung unter ständigem Rühren zu den Nudeln geben",
        "Sofort servieren, bevor das Ei stockt"
      ]
    }
  };
  
  const normalized = name.toLowerCase().trim();
  return recipeDB[normalized]?.[language] || getGenericInstructionsByDifficulty(difficulty, language);
}

function getGenericInstructionsByDifficulty(difficulty, language) {
  const instructions = {
    easy: {
      de: [
        "Alle Zutaten vorbereiten und bereitstellen",
        "Zutaten nach Anleitung verarbeiten",
        "Bei mittlerer Temperatur garen",
        "Heiß servieren"
      ]
    },
    medium: {
      de: [
        "Zutaten sorgfältig vorbereiten und abwiegen", 
        "Schritt für Schritt nach traditioneller Methode zubereiten",
        "Temperatur und Garzeit genau beachten",
        "Bei Bedarf abschmecken und nachwürzen",
        "Ansprechend anrichten und servieren"
      ]
    },
    hard: {
      de: [
        "Alle Zutaten präzise abmessen und vorbereiten",
        "Mit Sorgfalt und Geduld nach Profi-Methode arbeiten", 
        "Temperatur, Zeit und Konsistenz kontinuierlich überwachen",
        "Mehrfach abschmecken und fein abstimmen",
        "Professionell garnieren und stilvoll präsentieren"
      ]
    }
  };
  
  return instructions[difficulty]?.[language] || instructions.medium.de;
}

function getSmartIngredients(name, servings, cuisine, language) {
  const multiplier = servings / 4;
  
  const ingredientDB = {
    'pizza margherita': [
      { name: 'Mehl (Tipo 00)', quantity: 400, unit: 'g', pricePerUnit: 0.002 },
      { name: 'Wasser', quantity: 250, unit: 'ml', pricePerUnit: 0.001 },
      { name: 'Hefe (frisch)', quantity: 15, unit: 'g', pricePerUnit: 0.1 },
      { name: 'Olivenöl', quantity: 30, unit: 'ml', pricePerUnit: 0.02 },
      { name: 'Salz', quantity: 8, unit: 'g', pricePerUnit: 0.001 },
      { name: 'Tomatensauce', quantity: 200, unit: 'ml', pricePerUnit: 0.01 },
      { name: 'Mozzarella', quantity: 250, unit: 'g', pricePerUnit: 0.02 },
      { name: 'Basilikum (frisch)', quantity: 20, unit: 'g', pricePerUnit: 0.15 }
    ],
    'pasta carbonara': [
      { name: 'Spaghetti', quantity: 320, unit: 'g', pricePerUnit: 0.005 },
      { name: 'Speck (Pancetta)', quantity: 150, unit: 'g', pricePerUnit: 0.03 },
      { name: 'Eier (Eigelb)', quantity: 4, unit: 'Stück', pricePerUnit: 0.3 },
      { name: 'Parmesan', quantity: 80, unit: 'g', pricePerUnit: 0.05 },
      { name: 'Schwarzer Pfeffer', quantity: 2, unit: 'TL', pricePerUnit: 0.01 }
    ]
  };
  
  const normalized = name.toLowerCase().trim();
  const baseIngredients = ingredientDB[normalized];
  
  if (baseIngredients) {
    return baseIngredients.map(ing => ({
      ...ing,
      quantity: Math.round(ing.quantity * multiplier * 10) / 10
    }));
  }
  
  // Generic ingredients
  return [
    { name: 'Hauptzutat', quantity: Math.round(400 * multiplier), unit: 'g', pricePerUnit: 0.01 },
    { name: 'Gewürze', quantity: Math.round(20 * multiplier), unit: 'g', pricePerUnit: 0.05 },
    { name: 'Öl/Fett', quantity: Math.round(30 * multiplier), unit: 'ml', pricePerUnit: 0.02 }
  ];
}

function getSmartPrepTime(name) {
  const times = {
    'pizza': 45, 'pasta': 15, 'salad': 10, 'soup': 20, 'cake': 30, 'tiramisu': 30
  };
  
  const normalized = name.toLowerCase();
  for (const [key, time] of Object.entries(times)) {
    if (normalized.includes(key)) return time;
  }
  return 20;
}

function getSmartCookTime(name) {
  const times = {
    'pizza': 15, 'pasta': 12, 'salad': 0, 'soup': 30, 'cake': 45, 'tiramisu': 0
  };
  
  const normalized = name.toLowerCase();
  for (const [key, time] of Object.entries(times)) {
    if (normalized.includes(key)) return time;
  }
  return 25;
}

function calculateSmartNutrition(name, servings) {
  const nutritionDB = {
    'pizza margherita': { calories: 290, protein: 12, fat: 8, carbs: 42, fiber: 3 },
    'pasta carbonara': { calories: 520, protein: 22, fat: 18, carbs: 65, fiber: 3 },
    'caesar salad': { calories: 180, protein: 8, fat: 14, carbs: 8, fiber: 4 }
  };
  
  const normalized = name.toLowerCase().trim();
  return nutritionDB[normalized] || { calories: 250, protein: 12, fat: 8, carbs: 35, fiber: 3 };
}

function getSmartTags(name, cuisine, difficulty) {
  const baseTags = [cuisine, difficulty];
  
  const normalized = name.toLowerCase();
  
  if (normalized.includes('pizza') || normalized.includes('pasta')) baseTags.push('italienisch');
  if (!normalized.includes('meat') && !normalized.includes('speck')) baseTags.push('vegetarisch');
  
  baseTags.push('hausgemacht');
  return [...new Set(baseTags)];
}

// ==========================================
// EXISTING ENDPOINTS (Save, Analyze, Suggest)
// ==========================================

exports.saveAIRecipe = async (req, res) => {
  const t = await sequelize.transaction();
  const normalizeUnit = u => ({
    'EL': 'tbsp', 'TL': 'tsp', 'Stk': 'piece', 'Stück': 'piece',
    'stk': 'piece', 'pcs': 'piece', 'g': 'g', 'kg': 'kg',
    'ml': 'ml', 'l': 'l', 'cup': 'cup'
  }[u?.trim()] || 'g');

  try {
    const { productId, name, description, instructions,
      prepTime, cookTime, servings, difficulty,
      ingredients, cuisine, language = 'de' } = req.body;

    if (!productId)
      return res.status(400).json({ success: false, message: 'Product ID erforderlich' });

    const product = await Product.findOne({
      where: { id: productId, restaurantId: req.user.restaurantId }, transaction: t
    });
    if (!product)
      return res.status(404).json({ success: false, message: 'Produkt nicht gefunden' });

    await product.update({
      instructions: Array.isArray(instructions) ? instructions.join('\n') : instructions,
      prepTime: prepTime || 15, cookTime: cookTime || 20, servings: servings || 4,
      difficulty: DIFFICULTY_MAPPING[difficulty] || difficulty || 'medium',
      notes: (product.notes || '') + `\n[Recipe Language: ${language.toUpperCase()}]`
    }, { transaction: t });

    if (Array.isArray(ingredients)) {
      await ProductIngredient.destroy({ where: { productId: product.id }, transaction: t });
      let idx = 0;
      for (const ing of ingredients) {
        const [ingredient] = await Ingredient.findOrCreate({
          where: { name: ing.name, restaurantId: req.user.restaurantId },
          defaults: {
            name: ing.name, unit: normalizeUnit(ing.unit),
            pricePerUnit: ing.pricePerUnit || 0,
            restaurantId: req.user.restaurantId, stockQuantity: 0, minStockLevel: 0
          },
          transaction: t
        });
        await ProductIngredient.create({
          productId: product.id, ingredientId: ingredient.id,
          quantity: ing.quantity || 100, unit: normalizeUnit(ing.unit), sortOrder: idx++
        }, { transaction: t });
      }
    }

    await t.commit();
    const saved = await Product.findByPk(product.id, {
      include: [{ model: Category, as: 'category' },
        { model: Ingredient, as: 'ingredients', through: { attributes: ['quantity', 'unit'] } }]
    });
    res.json({ success: true, message: 'Rezept gespeichert', data: saved });
  } catch (e) {
    await t.rollback();
    res.status(500).json({ success: false, message: 'Fehler beim Speichern', error: e.message });
  }
};

exports.analyzeNutrition = async (req, res) => {
  try {
    const { ingredients, servings = 4 } = req.body;
    if (!Array.isArray(ingredients))
      return res.status(400).json({ success: false, message: 'Ingredients array required' });
    res.json({ success: true, data: calculateNutritionForIngredients(ingredients, servings) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error analyzing nutrition', error: e.message });
  }
};

exports.suggestIngredients = async (req, res) => {
  try {
    const { productName, servings = 4, language = 'de' } = req.body;
    if (!productName)
      return res.status(400).json({ success: false, message: 'Product name required' });
    res.json({ success: true, data: getLocalizedIngredients(productName, servings, language) });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error suggesting ingredients', error: e.message });
  }
};

// Helper functions for legacy compatibility
function getLocalizedIngredients(n, s, l) {
  return getSmartIngredients(n, s, 'international', l);
}

function calculateNutritionForIngredients(arr, s) {
  const t = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };
  arr.forEach(a => {
    const q = parseFloat(a.quantity) || 0;
    t.calories += q * 2; t.protein += q * 0.1; t.fat += q * 0.05;
    t.carbs += q * 0.2; t.fiber += q * 0.02;
  });
  return {
    total: t,
    perServing: Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v / s]))
  };
}