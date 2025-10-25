// backend/routes/nutrition.js
// API Routes für Nutrition Management

const express = require('express');
const router = express.Router();
const { Nutrition, Ingredient, Product } = require('../models');

// ==========================================
// GET - Nutrition für ein Ingredient
// ==========================================
router.get('/ingredient/:ingredientId', async (req, res) => {
  try {
    const nutrition = await Nutrition.findOne({
      where: {
        entity_type: 'ingredient',
        entity_id: req.params.ingredientId
      }
    });

    if (!nutrition) {
      return res.status(404).json({ 
        error: 'Keine Nährstoffdaten für dieses Ingredient gefunden' 
      });
    }

    res.json(nutrition);
  } catch (error) {
    console.error('Error fetching ingredient nutrition:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GET - Nutrition für ein Product
// ==========================================
router.get('/product/:productId', async (req, res) => {
  try {
    // Versuche zuerst gespeicherte Nutrition zu finden
    let nutrition = await Nutrition.findOne({
      where: {
        entity_type: 'product',
        entity_id: req.params.productId
      }
    });

    // Falls keine gespeichert, berechne automatisch
    if (!nutrition) {
      const product = await Product.findByPk(req.params.productId);
      if (!product) {
        return res.status(404).json({ error: 'Product nicht gefunden' });
      }

      const calculated = await product.calculateNutrition();
      return res.json({
        calculated: true,
        ...calculated
      });
    }

    res.json(nutrition);
  } catch (error) {
    console.error('Error fetching product nutrition:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// POST - Nutrition für Ingredient erstellen/updaten
// ==========================================
router.post('/ingredient/:ingredientId', async (req, res) => {
  try {
    const ingredient = await Ingredient.findByPk(req.params.ingredientId);
    if (!ingredient) {
      return res.status(404).json({ error: 'Ingredient nicht gefunden' });
    }

    const [nutrition, created] = await Nutrition.findOrCreate({
      where: {
        entity_type: 'ingredient',
        entity_id: req.params.ingredientId
      },
      defaults: {
        ...req.body,
        entity_type: 'ingredient',
        entity_id: req.params.ingredientId
      }
    });

    if (!created) {
      // Update existing
      await nutrition.update(req.body);
    }

    res.status(created ? 201 : 200).json(nutrition);
  } catch (error) {
    console.error('Error creating/updating ingredient nutrition:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// POST - Nutrition für Product erstellen/updaten
// ==========================================
router.post('/product/:productId', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product nicht gefunden' });
    }

    const [nutrition, created] = await Nutrition.findOrCreate({
      where: {
        entity_type: 'product',
        entity_id: req.params.productId
      },
      defaults: {
        ...req.body,
        entity_type: 'product',
        entity_id: req.params.productId
      }
    });

    if (!created) {
      await nutrition.update(req.body);
    }

    res.status(created ? 201 : 200).json(nutrition);
  } catch (error) {
    console.error('Error creating/updating product nutrition:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// POST - Berechne Nutrition automatisch für Product
// ==========================================
router.post('/product/:productId/calculate', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product nicht gefunden' });
    }

    const calculated = await product.calculateNutrition();
    
    // Optional: Speichere die berechneten Werte
    if (req.body.save) {
      const [nutrition] = await Nutrition.findOrCreate({
        where: {
          entity_type: 'product',
          entity_id: req.params.productId
        },
        defaults: {
          ...calculated,
          entity_type: 'product',
          entity_id: req.params.productId,
          nutrition_source: 'calculated'
        }
      });

      await nutrition.update({
        ...calculated,
        nutrition_source: 'calculated'
      });

      return res.json(nutrition);
    }

    res.json({ calculated: true, ...calculated });
  } catch (error) {
    console.error('Error calculating product nutrition:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// DELETE - Nutrition löschen
// ==========================================
router.delete('/:entityType/:entityId', async (req, res) => {
  try {
    const { entityType, entityId } = req.params;

    if (!['ingredient', 'product'].includes(entityType)) {
      return res.status(400).json({ 
        error: 'Invalid entity type. Must be "ingredient" or "product"' 
      });
    }

    const result = await Nutrition.destroy({
      where: {
        entity_type: entityType,
        entity_id: entityId
      }
    });

    if (result === 0) {
      return res.status(404).json({ error: 'Nutrition nicht gefunden' });
    }

    res.json({ message: 'Nutrition deleted successfully' });
  } catch (error) {
    console.error('Error deleting nutrition:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GET - Alle Ingredients mit Nutrition
// ==========================================
router.get('/ingredients/all', async (req, res) => {
  try {
    const ingredients = await Ingredient.findAll({
      include: [
        {
          model: Nutrition,
          as: 'nutrition',
          required: false
        }
      ]
    });

    res.json(ingredients);
  } catch (error) {
    console.error('Error fetching ingredients with nutrition:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GET - Alle Products mit Nutrition
// ==========================================
router.get('/products/all', async (req, res) => {
  try {
    const products = await Product.findAll({
      include: [
        {
          model: Nutrition,
          as: 'nutrition',
          required: false
        }
      ]
    });

    res.json(products);
  } catch (error) {
    console.error('Error fetching products with nutrition:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// POST - Bulk Update: AI-Analyze alle Ingredients
// ==========================================
router.post('/bulk/analyze-ingredients', async (req, res) => {
  try {
    const ingredients = await Ingredient.findAll({
      include: [
        {
          model: Nutrition,
          as: 'nutrition',
          required: false
        }
      ]
    });

    const results = {
      total: ingredients.length,
      analyzed: 0,
      failed: 0,
      skipped: 0
    };

    for (const ingredient of ingredients) {
      // Skip wenn bereits Nutrition vorhanden
      if (ingredient.nutrition) {
        results.skipped++;
        continue;
      }

      try {
        // Hier würde der AI-Service aufgerufen werden
        // Für jetzt: Placeholder
        results.analyzed++;
      } catch (error) {
        console.error(`Failed to analyze ${ingredient.name}:`, error);
        results.failed++;
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error in bulk analysis:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;