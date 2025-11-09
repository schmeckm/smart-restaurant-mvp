// backend/src/controllers/nutritionController.js
const { Nutrition, Ingredient, Product } = require('../models');
const claudeService = require('../services/claudeAIService');

// Helper function to validate UUID format
const isValidUUID = (str) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// =============================================================
// 1️⃣ Alle Nährwert-Einträge abrufen
// =============================================================
exports.getAll = async (req, res) => {
  try {
    const data = await Nutrition.findAll();
    res.json({ success: true, data });
  } catch (err) {
    console.error('❌ Error fetching nutrition data:', err);
    res.status(500).json({ success: false, message: 'Error fetching nutrition data' });
  }
};

// =============================================================
// 2️⃣ Neuen Nährwert-Eintrag erstellen
// =============================================================
exports.create = async (req, res) => {
  try {
    const nutrition = await Nutrition.create(req.body);
    res.status(201).json({ success: true, data: nutrition });
  } catch (err) {
    console.error('❌ Error creating nutrition entry:', err);
    res.status(400).json({ success: false, message: 'Error creating nutrition entry', error: err.message });
  }
};

// =============================================================
// 3️⃣ Einzelnen Eintrag per ID abrufen
// =============================================================
exports.getById = async (req, res) => {
  try {
    const data = await Nutrition.findByPk(req.params.id);
    if (!data) return res.status(404).json({ success: false, message: 'Nutrition entry not found' });
    res.json({ success: true, data });
  } catch (err) {
    console.error('❌ Error fetching nutrition entry:', err);
    res.status(500).json({ success: false, message: 'Error fetching nutrition entry' });
  }
};

// =============================================================
// 4️⃣ Nährwerte aktualisieren
// =============================================================
exports.update = async (req, res) => {
  try {
    const nutrition = await Nutrition.findByPk(req.params.id);
    if (!nutrition) return res.status(404).json({ success: false, message: 'Not found' });

    await nutrition.update(req.body);
    res.json({ success: true, data: nutrition });
  } catch (err) {
    console.error('❌ Error updating nutrition entry:', err);
    res.status(500).json({ success: false, message: 'Error updating nutrition entry' });
  }
};

// =============================================================
// 5️⃣ Nährwert löschen
// =============================================================
exports.delete = async (req, res) => {
  try {
    const deleted = await Nutrition.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    console.error('❌ Error deleting nutrition entry:', err);
    res.status(500).json({ success: false, message: 'Error deleting nutrition entry' });
  }
};

// =============================================================
// 6️⃣ Nährwerte einer Zutat abrufen (mit Claude-Fallback)
// =============================================================
exports.getByIngredient = async (req, res) => {
  try {
    const ingredientId = req.params.id;

    // Validate UUID format
    if (!isValidUUID(ingredientId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ingredient ID format'
      });
    }

    // Find ingredient
    const ingredient = await Ingredient.findByPk(ingredientId);
    if (!ingredient) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ingredient not found' 
      });
    }

    // Check if nutrition data already exists
    let nutrition = await Nutrition.findOne({
      where: { 
        entityType: 'ingredient', 
        entityId: ingredientId 
      },
    });

    if (!nutrition) {
      console.log(`🥦 Generating nutrition data for: ${ingredient.name}`);
      
      try {
        const aiData = await claudeService.generateNutritionForIngredient(ingredient.name);
        
        // Validate AI response
        if (!aiData || typeof aiData.calories === 'undefined') {
          throw new Error(`Claude AI returned invalid nutrition data for "${ingredient.name}"`);
        }

        // Create nutrition entry with safe defaults
        nutrition = await Nutrition.create({
          entityType: 'ingredient',
          entityId: ingredientId,
          calories: aiData.calories || 0,
          protein: aiData.protein || 0,
          fat: aiData.fat || 0,
          carbohydrates: aiData.carbohydrates || 0,
          fiber: aiData.fiber || 0,
          sugar: aiData.sugar || 0,
          nutritionSource: aiData.nutritionSource || aiData.nutrition_source || 'ai-claude',
        });

        console.log(`✅ Nutrition data created for: ${ingredient.name}`);
      } catch (aiError) {
        console.error('❌ AI Service Error:', aiError);
        return res.status(500).json({
          success: false,
          message: 'Failed to generate nutrition data',
          error: aiError.message
        });
      }
    } else {
      console.log(`📦 Using cached nutrition data for: ${ingredient.name}`);
    }

    res.json({
      success: true,
      source: nutrition.nutritionSource || 'db',
      data: nutrition,
    });
  } catch (error) {
    console.error('❌ Error in getByIngredient:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ingredient nutrition',
      error: error.message,
    });
  }
};

// =============================================================
// 7️⃣ Nährwerte eines Produkts abrufen (mit Claude-Fallback)
// =============================================================
exports.getByProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // Validate UUID format
    if (!isValidUUID(productId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    // Find product
    const product = await Product.findByPk(productId);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: 'Product not found' 
      });
    }

    // Check if nutrition data already exists
    let nutrition = await Nutrition.findOne({
      where: { 
        entityType: 'product', 
        entityId: productId 
      },
    });

    if (!nutrition) {
      console.log(`🍔 Generating nutrition data for: ${product.name}`);
      
      try {
        const aiData = await claudeService.generateNutritionForIngredient(product.name);
        
        // Validate AI response
        if (!aiData || typeof aiData.calories === 'undefined') {
          throw new Error(`Claude AI returned invalid nutrition data for "${product.name}"`);
        }

        // Create nutrition entry with safe defaults
        nutrition = await Nutrition.create({
          entityType: 'product',
          entityId: productId,
          calories: aiData.calories || 0,
          protein: aiData.protein || 0,
          fat: aiData.fat || 0,
          carbohydrates: aiData.carbohydrates || 0,
          fiber: aiData.fiber || 0,
          sugar: aiData.sugar || 0,
          nutritionSource: aiData.nutritionSource || aiData.nutrition_source || 'ai-claude',
        });

        console.log(`✅ Nutrition data created for: ${product.name}`);
      } catch (aiError) {
        console.error('❌ AI Service Error:', aiError);
        return res.status(500).json({
          success: false,
          message: 'Failed to generate nutrition data',
          error: aiError.message
        });
      }
    } else {
      console.log(`📦 Using cached nutrition data for: ${product.name}`);
    }

    res.json({
      success: true,
      source: nutrition.nutritionSource || 'db',
      data: nutrition,
    });
  } catch (error) {
    console.error('❌ Error in getByProduct:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product nutrition',
      error: error.message,
    });
  }
};

// =============================================================
// 8️⃣ Nährwerte-Status für mehrere Entities prüfen (Bulk)
// =============================================================
exports.checkBulkStatus = async (req, res) => {
  try {
    const { entityIds, entityType = 'ingredient' } = req.body;
    
    if (!Array.isArray(entityIds)) {
      return res.status(400).json({
        success: false,
        message: 'entityIds must be an array'
      });
    }

    console.log(`🔍 Checking nutrition status for ${entityIds.length} ${entityType}s`);

    // Prüfe Nährwerte in der DB
    const nutritionStatuses = await Nutrition.findAll({
      where: {
        entityType: entityType,
        entityId: entityIds
      },
      attributes: ['entityId', 'nutritionSource', 'calories']
    });

    console.log(`📦 Found nutrition data for ${nutritionStatuses.length} ${entityType}s`);

    // Status-Map erstellen
    const statusMap = {};
    entityIds.forEach(id => {
      const hasNutrition = nutritionStatuses.find(n => n.entityId === id);
      statusMap[id] = {
        status: hasNutrition ? 'available' : 'not_loaded',
        source: hasNutrition ? hasNutrition.nutritionSource : null
      };
    });

    res.json({
      success: true,
      data: statusMap
    });

  } catch (error) {
    console.error('❌ Error checking bulk nutrition status:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking nutrition status',
      error: error.message
    });
  }
};