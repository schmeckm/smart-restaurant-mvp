// backend/src/controllers/aiRecipeController.js
// MULTILINGUAL AI RECIPE CONTROLLER

const { Product, Ingredient, ProductIngredient, Category, sequelize } = require('../models');

// ==========================================
// DIFFICULTY MAPPING (German to English)
// ==========================================
const DIFFICULTY_MAPPING = {
  'Einfach': 'easy',
  'Mittel': 'medium', 
  'Schwer': 'hard',
  'einfach': 'easy',
  'mittel': 'medium',
  'schwer': 'hard',
  'easy': 'easy',
  'medium': 'medium',
  'hard': 'hard'
};

/**
 * Generate recipe using REAL Claude AI with language support
 * @route POST /api/v1/recipes/generate-with-ai
 */
exports.generateRecipeWithAI = async (req, res) => {
  try {
    const { 
      productId, 
      productName, 
      description,
      servings = 4,
      cuisine = 'international',
      difficulty = 'medium',
      language = 'de', // ← NEW: Language parameter
      dietaryRestrictions = [],
      customInstructions = ''
    } = req.body;

    if (!productId && !productName) {
      return res.status(400).json({
        success: false,
        message: 'Product ID oder Name erforderlich'
      });
    }

    console.log(`🤖 Starting REAL AI recipe generation in ${language.toUpperCase()}...`);

    // Find product if ID provided
    let product;
    if (productId) {
      product = await Product.findByPk(productId, {
        include: [{ model: Category, as: 'category' }]
      });
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Produkt nicht gefunden'
        });
      }
    }

    const finalProductName = product?.name || productName;
    const productDesc = product?.description || description || '';

    // Check for API Key
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      console.log(`⚠️ No valid ANTHROPIC_API_KEY found - falling back to ${language} templates`);
      return generateMultilingualTemplate(req, res, finalProductName, servings, cuisine, difficulty, language);
    }

    console.log('🚀 Claude API Key found, using REAL AI...');
    console.log(`🎯 Generating ${language.toUpperCase()} recipe for:`, finalProductName, '| Servings:', servings, '| Cuisine:', cuisine);

    try {
      // ==========================================
      // ECHTE CLAUDE AI INTEGRATION MIT SPRACHE
      // ==========================================
      const claudeAIService = require('../services/claudeAIService');
      
      const aiResult = await claudeAIService.generateRecipe({
        productName: finalProductName,
        productDescription: productDesc,
        servings,
        cuisine,
        difficulty,
        language, // ← Pass language to AI service
        dietaryRestrictions,
        customInstructions
      });

      if (!aiResult.success) {
        throw new Error(aiResult.error || 'AI generation failed');
      }

      console.log(`✅ REAL Claude AI Recipe generated successfully in ${language.toUpperCase()}!`);
      console.log('📝 Recipe name:', aiResult.data.name);
      console.log('🥬 Ingredients count:', aiResult.data.ingredients?.length || 0);

      res.json({
        success: true,
        message: `Recipe generated with REAL Claude AI in ${language.toUpperCase()}! 🤖✨`,
        data: {
          ...aiResult.data,
          generatedBy: 'claude-ai-real',
          generatedAt: new Date().toISOString()
        }
      });

    } catch (aiError) {
      console.warn(`⚠️ Claude AI failed, falling back to ${language} templates:`, aiError.message);
      return generateMultilingualTemplate(req, res, finalProductName, servings, cuisine, difficulty, language);
    }

  } catch (error) {
    console.error('❌ Error in AI recipe generation:', error);
    res.status(500).json({
      success: false,
      message: 'Error generating recipe',
      error: error.message
    });
  }
};

/**
 * Multilingual template fallback function
 */
function generateMultilingualTemplate(req, res, productName, servings, cuisine, difficulty, language) {
  console.log(`📋 Using enhanced ${language.toUpperCase()} template fallback for:`, productName);
  
  const recipe = {
    name: getLocalizedName(productName, language),
    description: getLocalizedDescription(productName, cuisine, language),
    instructions: getLocalizedInstructions(productName, language),
    prepTime: getPrepTime(productName),
    cookTime: getCookTime(productName),
    servings,
    difficulty,
    cuisine,
    language,
    ingredients: getLocalizedIngredients(productName, servings, language),
    nutrition: calculateNutritionForIngredients(getLocalizedIngredients(productName, servings, language), servings),
    tags: [cuisine, difficulty],
    generatedBy: `enhanced-${language}-template`,
    generatedAt: new Date().toISOString()
  };

  res.json({
    success: true,
    message: `Recipe generated with enhanced ${language.toUpperCase()} templates (AI fallback)`,
    data: recipe
  });
}

/**
 * Save AI-generated recipe (multilingual)
 * @route POST /api/v1/recipes/save-ai-recipe
 */
exports.saveAIRecipe = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const {
      productId,
      name,
      description,
      instructions,
      prepTime,
      cookTime,
      servings,
      difficulty,
      ingredients,
      nutrition,
      tags,
      cuisine,
      language = 'de' // ← NEW: Language parameter
    } = req.body;

    console.log(`💾 Saving ${language.toUpperCase()} AI recipe for product:`, productId);
    console.log('📝 Recipe name:', name);

    if (!productId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Product ID erforderlich'
      });
    }

    const product = await Product.findByPk(productId);
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Produkt nicht gefunden'
      });
    }

    // Convert instructions array to string
    const instructionsString = Array.isArray(instructions) 
      ? instructions.join('\n') 
      : instructions;

    // Map German difficulty to English
    const mappedDifficulty = DIFFICULTY_MAPPING[difficulty] || difficulty || 'medium';
    console.log(`🔄 Mapping difficulty: "${difficulty}" → "${mappedDifficulty}"`);

    // Update product with multilingual support
    await product.update({
      instructions: instructionsString,
      prepTime: prepTime || 15,
      cookTime: cookTime || 20,
      servings: servings || 4,
      difficulty: mappedDifficulty,
      // Store language info in notes or custom field
      notes: product.notes ? `${product.notes}\n[Recipe Language: ${language.toUpperCase()}]` : `[Recipe Language: ${language.toUpperCase()}]`
    }, { transaction });

    // Handle ingredients
    if (ingredients && Array.isArray(ingredients)) {
      console.log(`🥬 Processing ${ingredients.length} ${language.toUpperCase()}-generated ingredients...`);

      // Clear existing ingredients
      await ProductIngredient.destroy({
        where: { productId: product.id },
        transaction
      });

      // Add new ingredients
      let processedCount = 0;
      for (const ing of ingredients) {
        if (!ing.name) continue;

        try {
          let ingredient = await Ingredient.findOne({
            where: { 
              name: {
                [sequelize.Sequelize.Op.iLike]: ing.name.trim()
              }
            },
            transaction
          });

          if (!ingredient) {
            ingredient = await Ingredient.create({
              name: ing.name.trim(),
              unit: ing.unit || 'g',
              pricePerUnit: parseFloat(ing.pricePerUnit) || 0,
              isActive: true
            }, { transaction });
          }

          await ProductIngredient.create({
            productId: product.id,
            ingredientId: ingredient.id,
            quantity: parseFloat(ing.quantity) || 0,
            unit: ing.unit || 'g',
            preparationNote: ing.notes || null
          }, { transaction });

          processedCount++;
        } catch (ingError) {
          console.error(`❌ Error processing ingredient ${ing.name}:`, ingError.message);
        }
      }

      console.log(`✅ Successfully processed ${processedCount} ${language.toUpperCase()}-generated ingredients`);
    }

    await transaction.commit();

    const updatedProduct = await Product.findByPk(product.id, {
      include: [{
        model: Ingredient,
        as: 'ingredients',
        through: { 
          attributes: ['quantity', 'unit', 'preparationNote'],
          as: 'ProductIngredient'
        }
      }]
    });

    res.json({
      success: true,
      message: `${language.toUpperCase()} AI-Rezept "${name}" erfolgreich gespeichert! 🤖✨`,
      data: updatedProduct
    });

  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error saving AI recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Error saving AI recipe',
      error: error.message
    });
  }
};

// ==========================================
// MULTILINGUAL TEMPLATE HELPERS
// ==========================================

function getLocalizedName(productName, language) {
  const translations = {
    'pizza margherita': {
      'de': 'Pizza Margherita',
      'en': 'Pizza Margherita',
      'it': 'Pizza Margherita',
      'fr': 'Pizza Margherita'
    },
    'tiramisu': {
      'de': 'Tiramisu',
      'en': 'Tiramisu', 
      'it': 'Tiramisù',
      'fr': 'Tiramisu'
    },
    'carbonara': {
      'de': 'Spaghetti Carbonara',
      'en': 'Spaghetti Carbonara',
      'it': 'Spaghetti alla Carbonara',
      'fr': 'Spaghetti à la Carbonara'
    }
  };

  const key = productName.toLowerCase();
  return translations[key]?.[language] || productName;
}

function getLocalizedDescription(productName, cuisine, language) {
  const descriptions = {
    'de': `Ein köstliches ${cuisine}-Gericht, traditionell zubereitet`,
    'en': `A delicious ${cuisine} dish, traditionally prepared`,
    'it': `Un delizioso piatto ${cuisine}, preparato in modo tradizionale`,
    'fr': `Un délicieux plat ${cuisine}, préparé de manière traditionnelle`
  };

  return descriptions[language] || descriptions['de'];
}

function getLocalizedInstructions(productName, language) {
  const name = productName.toLowerCase();
  
  const instructions = {
    'tiramisu': {
      'de': [
        "Starken Espresso zubereiten und vollständig abkühlen lassen",
        "Eier trennen - Eigelb und Zucker schaumig schlagen (3-4 Minuten)",
        "Mascarpone zur Eigelbmasse geben und glatt rühren",
        "Eiweiß zu weichen Spitzen schlagen",
        "Eiweiß vorsichtig unter die Mascarpone-Masse heben",
        "Löffelbiskuits kurz in Espresso tauchen und einzeln schichten",
        "Hälfte der Mascarpone-Masse über die Biskuits streichen",
        "Mit zweiter Lage getränkter Biskuits wiederholen",
        "Restliche Mascarpone-Masse darüber geben und glatt streichen",
        "Mit Frischhaltefolie abdecken und mindestens 4 Stunden kühlen",
        "Vor dem Servieren großzügig mit Kakaopulver bestäuben"
      ],
      'en': [
        "Brew strong espresso coffee and let it cool completely",
        "Separate egg yolks from whites in two clean bowls",
        "Whisk egg yolks with sugar until pale and creamy (3-4 minutes)",
        "Add mascarpone to egg mixture and whisk until smooth",
        "In separate bowl, whip egg whites to soft peaks",
        "Gently fold egg whites into mascarpone mixture",
        "Quickly dip each ladyfinger in espresso and arrange in single layer",
        "Spread half the mascarpone mixture over ladyfingers",
        "Repeat with second layer of dipped ladyfingers",
        "Top with remaining mascarpone mixture and smooth surface",
        "Cover with plastic wrap and refrigerate for at least 4 hours",
        "Before serving, dust generously with unsweetened cocoa powder"
      ],
      'it': [
        "Preparare un caffè espresso forte e lasciarlo raffreddare completamente",
        "Separare i tuorli dagli albumi in due ciotole pulite",
        "Montare i tuorli con lo zucchero fino a ottenere un composto spumoso (3-4 minuti)",
        "Aggiungere il mascarpone al composto di tuorli e mescolare fino a ottenere una crema liscia",
        "In una ciotola separata, montare gli albumi a neve ferma",
        "Incorporare delicatamente gli albumi montati nel composto di mascarpone",
        "Inzuppare rapidamente ogni savoiardo nell'espresso e disporli in un unico strato",
        "Stendere metà del composto di mascarpone sui savoiardi",
        "Ripetere con un secondo strato di savoiardi inzuppati",
        "Coprire con il restante composto di mascarpone e livellare la superficie",
        "Coprire con pellicola trasparente e refrigerare per almeno 4 ore",
        "Prima di servire, spolverare generosamente con cacao amaro in polvere"
      ]
    }
  };

  return instructions[name]?.[language] || getGenericInstructions(language);
}

function getGenericInstructions(language) {
  const generic = {
    'de': [
      "Alle Zutaten bereitstellen und vorbereiten",
      "Nach traditionellem Rezept zubereiten",
      "Bei empfohlener Temperatur und Zeit garen",
      "Schön anrichten, garnieren und servieren"
    ],
    'en': [
      "Prepare and organize all ingredients",
      "Follow traditional recipe preparation",
      "Cook at recommended temperature and time",
      "Plate beautifully, garnish and serve"
    ],
    'it': [
      "Preparare e organizzare tutti gli ingredienti",
      "Seguire la preparazione tradizionale della ricetta",
      "Cuocere alla temperatura e tempo raccomandati",
      "Impiattare con cura, guarnire e servire"
    ],
    'fr': [
      "Préparer et organiser tous les ingrédients",
      "Suivre la préparation traditionnelle de la recette",
      "Cuire à la température et au temps recommandés",
      "Dresser joliment, garnir et servir"
    ]
  };

  return generic[language] || generic['de'];
}

function getLocalizedIngredients(productName, servings, language) {
  const name = productName.toLowerCase();
  const multiplier = servings / 4;
  
  const ingredients = {
    'tiramisu': {
      'de': [
        { name: 'Mascarpone', quantity: 500, unit: 'g', pricePerUnit: 0.02 },
        { name: 'Löffelbiskuits', quantity: 200, unit: 'g', pricePerUnit: 0.008 },
        { name: 'Starker Espresso', quantity: 300, unit: 'ml', pricePerUnit: 0.01 },
        { name: 'Eigelb', quantity: 6, unit: 'Stück', pricePerUnit: 0.30 },
        { name: 'Eiweiß', quantity: 3, unit: 'Stück', pricePerUnit: 0.30 },
        { name: 'Zucker', quantity: 100, unit: 'g', pricePerUnit: 0.002 },
        { name: 'Kakaopulver (ungesüßt)', quantity: 30, unit: 'g', pricePerUnit: 0.05 }
      ],
      'en': [
        { name: 'Mascarpone', quantity: 500, unit: 'g', pricePerUnit: 0.02 },
        { name: 'Ladyfingers', quantity: 200, unit: 'g', pricePerUnit: 0.008 },
        { name: 'Strong Espresso', quantity: 300, unit: 'ml', pricePerUnit: 0.01 },
        { name: 'Egg Yolks', quantity: 6, unit: 'pieces', pricePerUnit: 0.30 },
        { name: 'Egg Whites', quantity: 3, unit: 'pieces', pricePerUnit: 0.30 },
        { name: 'Sugar', quantity: 100, unit: 'g', pricePerUnit: 0.002 },
        { name: 'Unsweetened Cocoa Powder', quantity: 30, unit: 'g', pricePerUnit: 0.05 }
      ],
      'it': [
        { name: 'Mascarpone', quantity: 500, unit: 'g', pricePerUnit: 0.02 },
        { name: 'Savoiardi', quantity: 200, unit: 'g', pricePerUnit: 0.008 },
        { name: 'Caffè Espresso Forte', quantity: 300, unit: 'ml', pricePerUnit: 0.01 },
        { name: 'Tuorli d\'uovo', quantity: 6, unit: 'pezzi', pricePerUnit: 0.30 },
        { name: 'Albumi', quantity: 3, unit: 'pezzi', pricePerUnit: 0.30 },
        { name: 'Zucchero', quantity: 100, unit: 'g', pricePerUnit: 0.002 },
        { name: 'Cacao Amaro in Polvere', quantity: 30, unit: 'g', pricePerUnit: 0.05 }
      ]
    }
  };

  const productIngredients = ingredients[name]?.[language] || getGenericIngredients(language);
  
  // Scale for servings
  return productIngredients.map(ing => ({
    ...ing,
    quantity: Math.round(ing.quantity * multiplier * 10) / 10
  }));
}

function getGenericIngredients(language) {
  const generic = {
    'de': [
      { name: 'Hauptzutat', quantity: 400, unit: 'g', pricePerUnit: 0.01 },
      { name: 'Nebenzutat', quantity: 200, unit: 'g', pricePerUnit: 0.008 },
      { name: 'Gewürze', quantity: 10, unit: 'g', pricePerUnit: 0.02 }
    ],
    'en': [
      { name: 'Main Ingredient', quantity: 400, unit: 'g', pricePerUnit: 0.01 },
      { name: 'Secondary Ingredient', quantity: 200, unit: 'g', pricePerUnit: 0.008 },
      { name: 'Seasonings', quantity: 10, unit: 'g', pricePerUnit: 0.02 }
    ],
    'it': [
      { name: 'Ingrediente Principale', quantity: 400, unit: 'g', pricePerUnit: 0.01 },
      { name: 'Ingrediente Secondario', quantity: 200, unit: 'g', pricePerUnit: 0.008 },
      { name: 'Spezie', quantity: 10, unit: 'g', pricePerUnit: 0.02 }
    ],
    'fr': [
      { name: 'Ingrédient Principal', quantity: 400, unit: 'g', pricePerUnit: 0.01 },
      { name: 'Ingrédient Secondaire', quantity: 200, unit: 'g', pricePerUnit: 0.008 },
      { name: 'Épices', quantity: 10, unit: 'g', pricePerUnit: 0.02 }
    ]
  };

  return generic[language] || generic['de'];
}

function getPrepTime(productName) {
  const name = productName.toLowerCase();
  
  if (name.includes('tiramisu')) return 45;
  if (name.includes('salad')) return 10;
  if (name.includes('burger')) return 15;
  if (name.includes('pizza')) return 20;
  if (name.includes('pasta')) return 15;
  
  return 20;
}

function getCookTime(productName) {
  const name = productName.toLowerCase();
  
  if (name.includes('tiramisu')) return 0; // No cooking, just chilling
  if (name.includes('salad')) return 0;
  if (name.includes('pizza')) return 15;
  if (name.includes('pasta')) return 12;
  if (name.includes('burger')) return 8;
  
  return 20;
}

function calculateNutritionForIngredients(ingredients, servings) {
  const totals = { calories: 0, protein: 0, fat: 0, carbs: 0, fiber: 0 };

  ingredients.forEach(ing => {
    const quantity = parseFloat(ing.quantity) || 0;
    totals.calories += quantity * 2;
    totals.protein += quantity * 0.1;
    totals.fat += quantity * 0.05;
    totals.carbs += quantity * 0.2;
    totals.fiber += quantity * 0.02;
  });

  return {
    total: {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein * 10) / 10,
      fat: Math.round(totals.fat * 10) / 10,
      carbs: Math.round(totals.carbs * 10) / 10,
      fiber: Math.round(totals.fiber * 10) / 10
    },
    perServing: {
      calories: Math.round(totals.calories / servings),
      protein: Math.round((totals.protein / servings) * 10) / 10,
      fat: Math.round((totals.fat / servings) * 10) / 10,
      carbs: Math.round((totals.carbs / servings) * 10) / 10,
      fiber: Math.round((totals.fiber / servings) * 10) / 10
    }
  };
}

// Andere Controller-Methoden bleiben gleich...
exports.analyzeNutrition = async (req, res) => {
  try {
    const { ingredients, servings = 4 } = req.body;

    if (!ingredients || !Array.isArray(ingredients)) {
      return res.status(400).json({
        success: false,
        message: 'Ingredients array required'
      });
    }

    const nutrition = calculateNutritionForIngredients(ingredients, servings);

    res.json({
      success: true,
      data: nutrition
    });

  } catch (error) {
    console.error('❌ Error analyzing nutrition:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing nutrition',
      error: error.message
    });
  }
};

exports.suggestIngredients = async (req, res) => {
  try {
    const { productName, servings = 4, language = 'de' } = req.body;

    if (!productName) {
      return res.status(400).json({
        success: false,
        message: 'Product name required'
      });
    }

    const suggestions = getLocalizedIngredients(productName, servings, language);

    res.json({
      success: true,
      data: suggestions
    });

  } catch (error) {
    console.error('❌ Error suggesting ingredients:', error);
    res.status(500).json({
      success: false,
      message: 'Error suggesting ingredients',
      error: error.message
    });
  }
};