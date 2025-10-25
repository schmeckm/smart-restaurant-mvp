// backend/routes/recipes.js
// API Routes für Recipe/Product-Ingredient Management (M:N)

const express = require('express');
const router = express.Router();
const { Product, Ingredient, ProductIngredient, Nutrition } = require('../models');

// ==========================================
// GET - Komplettes Rezept für ein Product
// ==========================================
router.get('/:productId', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId, {
      include: [
        {
          model: Ingredient,
          as: 'ingredients',
          through: {
            attributes: ['id', 'quantity', 'unit', 'preparation_note', 'is_optional']
          },
          include: [
            {
              model: Nutrition,
              as: 'nutrition',
              required: false
            }
          ]
        }
      ]
    });

    if (!product) {
      return res.status(404).json({ error: 'Product nicht gefunden' });
    }

    // Berechne zusätzliche Infos
    const cost = await product.calculateCost();
    const nutrition = await product.calculateNutrition();
    const margin = await product.getMargin();

    res.json({
      product,
      cost: parseFloat(cost).toFixed(2),
      nutrition,
      margin
    });
  } catch (error) {
    console.error('Error fetching recipe:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// POST - Zutat zu Rezept hinzufügen
// ==========================================
router.post('/:productId/ingredients', async (req, res) => {
  try {
    const { ingredient_id, quantity, unit, preparation_note, is_optional } = req.body;

    // Validierung
    const product = await Product.findByPk(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product nicht gefunden' });
    }

    const ingredient = await Ingredient.findByPk(ingredient_id);
    if (!ingredient) {
      return res.status(404).json({ error: 'Ingredient nicht gefunden' });
    }

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Quantity muss größer als 0 sein' });
    }

    if (!unit) {
      return res.status(400).json({ error: 'Unit ist erforderlich' });
    }

    // Erstelle oder Update ProductIngredient
    const [productIngredient, created] = await ProductIngredient.findOrCreate({
      where: {
        product_id: req.params.productId,
        ingredient_id: ingredient_id
      },
      defaults: {
        quantity,
        unit,
        preparation_note,
        is_optional: is_optional || false
      }
    });

    if (!created) {
      // Update existing
      await productIngredient.update({
        quantity,
        unit,
        preparation_note,
        is_optional: is_optional || false
      });
    }

    // Lade mit Ingredient-Details
    const result = await ProductIngredient.findByPk(productIngredient.id, {
      include: [
        {
          model: Ingredient,
          as: 'ingredient',
          include: [
            {
              model: Nutrition,
              as: 'nutrition',
              required: false
            }
          ]
        }
      ]
    });

    res.status(created ? 201 : 200).json(result);
  } catch (error) {
    console.error('Error adding ingredient to recipe:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// PUT - Ingredient-Menge im Rezept ändern
// ==========================================
router.put('/:productId/ingredients/:ingredientId', async (req, res) => {
  try {
    const { quantity, unit, preparation_note, is_optional } = req.body;

    const productIngredient = await ProductIngredient.findOne({
      where: {
        product_id: req.params.productId,
        ingredient_id: req.params.ingredientId
      }
    });

    if (!productIngredient) {
      return res.status(404).json({ 
        error: 'Diese Zutat ist nicht im Rezept enthalten' 
      });
    }

    await productIngredient.update({
      quantity: quantity !== undefined ? quantity : productIngredient.quantity,
      unit: unit || productIngredient.unit,
      preparation_note: preparation_note !== undefined ? preparation_note : productIngredient.preparation_note,
      is_optional: is_optional !== undefined ? is_optional : productIngredient.is_optional
    });

    const result = await ProductIngredient.findByPk(productIngredient.id, {
      include: [
        {
          model: Ingredient,
          as: 'ingredient'
        }
      ]
    });

    res.json(result);
  } catch (error) {
    console.error('Error updating recipe ingredient:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// DELETE - Zutat aus Rezept entfernen
// ==========================================
router.delete('/:productId/ingredients/:ingredientId', async (req, res) => {
  try {
    const result = await ProductIngredient.destroy({
      where: {
        product_id: req.params.productId,
        ingredient_id: req.params.ingredientId
      }
    });

    if (result === 0) {
      return res.status(404).json({ 
        error: 'Diese Zutat ist nicht im Rezept enthalten' 
      });
    }

    res.json({ message: 'Ingredient erfolgreich aus Rezept entfernt' });
  } catch (error) {
    console.error('Error removing ingredient from recipe:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GET - Alle Products die ein bestimmtes Ingredient verwenden
// ==========================================
router.get('/ingredient/:ingredientId/products', async (req, res) => {
  try {
    const productIngredients = await ProductIngredient.findAll({
      where: {
        ingredient_id: req.params.ingredientId
      },
      include: [
        {
          model: Product,
          as: 'product'
        }
      ]
    });

    const products = productIngredients.map(pi => ({
      ...pi.product.toJSON(),
      quantity_used: pi.quantity,
      unit: pi.unit
    }));

    res.json({
      ingredient_id: req.params.ingredientId,
      used_in_products_count: products.length,
      products
    });
  } catch (error) {
    console.error('Error fetching products using ingredient:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// POST - Komplettes Rezept auf einmal erstellen/updaten
// ==========================================
router.post('/:productId/full-recipe', async (req, res) => {
  try {
    const { ingredients } = req.body;

    if (!Array.isArray(ingredients)) {
      return res.status(400).json({ 
        error: 'ingredients muss ein Array sein' 
      });
    }

    const product = await Product.findByPk(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product nicht gefunden' });
    }

    // Lösche alte Rezept-Einträge
    await ProductIngredient.destroy({
      where: { product_id: req.params.productId }
    });

    // Erstelle neue Einträge
    const results = [];
    for (const ing of ingredients) {
      if (!ing.ingredient_id || !ing.quantity || !ing.unit) {
        continue; // Skip invalid entries
      }

      const productIngredient = await ProductIngredient.create({
        product_id: req.params.productId,
        ingredient_id: ing.ingredient_id,
        quantity: ing.quantity,
        unit: ing.unit,
        preparation_note: ing.preparation_note,
        is_optional: ing.is_optional || false
      });

      results.push(productIngredient);
    }

    // Lade komplettes Rezept mit Details
    const recipe = await Product.findByPk(req.params.productId, {
      include: [
        {
          model: Ingredient,
          as: 'ingredients',
          through: {
            attributes: ['id', 'quantity', 'unit', 'preparation_note', 'is_optional']
          }
        }
      ]
    });

    res.json(recipe);
  } catch (error) {
    console.error('Error creating full recipe:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GET - Check Verfügbarkeit aller Zutaten für Product
// ==========================================
router.get('/:productId/availability', async (req, res) => {
  try {
    const quantity = parseInt(req.query.quantity) || 1;

    const product = await Product.findByPk(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product nicht gefunden' });
    }

    const availability = await product.checkIngredientsAvailability(quantity);
    
    const allAvailable = availability.every(item => item.isAvailable);

    res.json({
      product_id: req.params.productId,
      product_name: product.name,
      quantity_to_produce: quantity,
      all_available: allAvailable,
      ingredients: availability
    });
  } catch (error) {
    console.error('Error checking availability:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GET - Berechne Kosten und Marge für Product
// ==========================================
router.get('/:productId/margins', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.productId);
    if (!product) {
      return res.status(404).json({ error: 'Product nicht gefunden' });
    }

    const margin = await product.getMargin();

    res.json({
      product_id: req.params.productId,
      product_name: product.name,
      ...margin
    });
  } catch (error) {
    console.error('Error calculating margins:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==========================================
// GET - Meistverwendete Ingredients (Statistics)
// ==========================================
router.get('/stats/most-used-ingredients', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const mostUsed = await ProductIngredient.getMostUsedIngredients(limit);

    res.json(mostUsed);
  } catch (error) {
    console.error('Error fetching most used ingredients:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;