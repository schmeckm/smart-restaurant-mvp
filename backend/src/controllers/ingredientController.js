// backend/src/controllers/ingredientController.js
const { Ingredient, Product, ProductIngredient, Nutrition } = require('../models');
const { Op } = require('sequelize');

/**
 * ========================================
 * 🧩 GET ALL INGREDIENTS (ohne Nutrition)
 * ========================================
 * GET /api/v1/ingredients
 * Private
 */
exports.getAllIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.findAll({
      where: {
        restaurantId: req.user.restaurantId,
        isActive: true
      },
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      count: ingredients.length,
      data: ingredients
    });
  } catch (error) {
    console.error('❌ Get all ingredients error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Zutaten'
    });
  }
};

/**
 * ========================================
 * 🧬 GET INGREDIENT NUTRITION (Lazy Load)
 * ========================================
 * GET /api/v1/ingredients/:id/nutrition
 * Private
 */
exports.getIngredientNutrition = async (req, res) => {
  try {
    const ingredient = await Ingredient.findOne({
      where: {
        id: req.params.id,
        restaurantId: req.user.restaurantId
      }
    });

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: 'Zutat nicht gefunden'
      });
    }

    const nutrition = await Nutrition.findOne({
      where: {
        entityType: 'ingredient',
        entityId: ingredient.id
      }
    });

    res.json({
      success: true,
      data: { ingredient, nutrition: nutrition || null }
    });
  } catch (error) {
    console.error('❌ Get ingredient nutrition error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Nährwerte'
    });
  }
};

/**
 * ========================================
 * 🧾 GET SINGLE INGREDIENT
 * ========================================
 * GET /api/v1/ingredients/:id
 * Private
 */
exports.getIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findOne({
      where: {
        id: req.params.id,
        restaurantId: req.user.restaurantId
      },
      include: [
        {
          model: Product,
          as: 'products',
          through: { attributes: ['quantity', 'unit'] },
          where: { isActive: true },
          required: false
        }
      ]
    });

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: 'Zutat nicht gefunden'
      });
    }

    res.json({
      success: true,
      data: ingredient
    });
  } catch (error) {
    console.error('❌ Get ingredient error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Zutat'
    });
  }
};

/**
 * ========================================
 * 🧱 CREATE INGREDIENT
 * ========================================
 * POST /api/v1/ingredients
 * Private (admin/manager)
 */
exports.createIngredient = async (req, res) => {
  try {
    const ingredientData = {
      ...req.body,
      restaurantId: req.user.restaurantId
    };

    const ingredient = await Ingredient.create(ingredientData);

    res.status(201).json({
      success: true,
      message: 'Zutat erfolgreich erstellt',
      data: ingredient
    });
  } catch (error) {
    console.error('❌ Create ingredient error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen der Zutat',
      error: error.message
    });
  }
};

/**
 * ========================================
 * ✏️ UPDATE INGREDIENT
 * ========================================
 * PUT /api/v1/ingredients/:id
 * Private (admin/manager)
 */
exports.updateIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findOne({
      where: {
        id: req.params.id,
        restaurantId: req.user.restaurantId
      }
    });

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: 'Zutat nicht gefunden'
      });
    }

    await ingredient.update(req.body);

    res.json({
      success: true,
      message: 'Zutat erfolgreich aktualisiert',
      data: ingredient
    });
  } catch (error) {
    console.error('❌ Update ingredient error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren der Zutat'
    });
  }
};

/**
 * ========================================
 * 🗑️ DELETE INGREDIENT
 * ========================================
 * DELETE /api/v1/ingredients/:id
 * Private (admin)
 */
exports.deleteIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findOne({
      where: {
        id: req.params.id,
        restaurantId: req.user.restaurantId
      },
      include: [{ model: Product, as: 'products' }]
    });

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: 'Zutat nicht gefunden'
      });
    }

    if (ingredient.products && ingredient.products.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Zutat kann nicht gelöscht werden, da sie in Produkten verwendet wird',
        usedIn: ingredient.products.map(p => ({ id: p.id, name: p.name }))
      });
    }

    await ingredient.update({ isActive: false });

    res.json({
      success: true,
      message: 'Zutat erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('❌ Delete ingredient error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen der Zutat'
    });
  }
};

/**
 * ========================================
 * 📉 LOW STOCK INGREDIENTS
 * ========================================
 * GET /api/v1/ingredients/low-stock
 * Private
 */
exports.getLowStockIngredients = async (req, res) => {
  try {
    const ingredients = await Ingredient.findAll({
      where: {
        restaurantId: req.user.restaurantId,
        isActive: true,
        stockQuantity: { [Op.lte]: sequelize.col('min_stock_level') }
      },
      order: [['stockQuantity', 'ASC']]
    });

    res.json({
      success: true,
      count: ingredients.length,
      data: ingredients
    });
  } catch (error) {
    console.error('❌ Get low stock ingredients error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Zutaten mit niedrigem Lagerbestand'
    });
  }
};

/**
 * ========================================
 * ⚖️ UPDATE STOCK
 * ========================================
 * PATCH /api/v1/ingredients/:id/stock
 * Private (admin/manager)
 */
exports.updateStock = async (req, res) => {
  try {
    const { quantity, operation } = req.body;

    if (!quantity || !operation) {
      return res.status(400).json({
        success: false,
        message: 'Menge und Operation sind erforderlich'
      });
    }

    const ingredient = await Ingredient.findOne({
      where: {
        id: req.params.id,
        restaurantId: req.user.restaurantId
      }
    });

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: 'Zutat nicht gefunden'
      });
    }

    const currentStock = parseFloat(ingredient.stockQuantity);
    const change = parseFloat(quantity);
    const newStock = operation === 'add' ? currentStock + change : currentStock - change;

    if (newStock < 0) {
      return res.status(400).json({
        success: false,
        message: 'Unzureichender Lagerbestand'
      });
    }

    await ingredient.update({ stockQuantity: newStock });

    res.json({
      success: true,
      message: 'Lagerbestand erfolgreich aktualisiert',
      data: {
        previousStock: currentStock,
        newStock,
        change,
        isLowStock: newStock <= parseFloat(ingredient.minStockLevel)
      }
    });
  } catch (error) {
    console.error('❌ Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren des Lagerbestands'
    });
  }
};
