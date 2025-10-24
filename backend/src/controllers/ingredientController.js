// backend/src/controllers/ingredientController.js
const { Ingredient, sequelize } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all ingredients
// @route   GET /api/v1/ingredients
// @access  Private
exports.getIngredients = async (req, res) => {
  try {
    const { page = 1, limit = 20, name, category } = req.query;
    const offset = (page - 1) * limit;

    // ✅ WHERE clause for filtering
    const whereClause = {};
    if (name) {
      whereClause.name = {
        [Op.iLike]: `%${name}%`  // Case-insensitive search
      };
    }
    if (category) {
      whereClause.category = category;
    }

    const { count, rows } = await Ingredient.findAndCountAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        ingredients: rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          total: count,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get ingredients error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Zutaten',
      error: error.message
    });
  }
};

// @desc    Get single ingredient
// @route   GET /api/v1/ingredients/:id
// @access  Private
exports.getIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findByPk(req.params.id);

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
    console.error('Get ingredient error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Zutat',
      error: error.message
    });
  }
};

// @desc    Create ingredient
// @route   POST /api/v1/ingredients
// @access  Private
exports.createIngredient = async (req, res) => {
  try {
    const { name, unit, cost_per_unit, stock_quantity, min_stock, supplier, category } = req.body;

    if (!name || !unit) {
      return res.status(400).json({
        success: false,
        message: 'Name und Unit sind erforderlich'
      });
    }

    const ingredient = await Ingredient.create({
      name,
      unit,
      cost_per_unit: cost_per_unit || 0,
      stock_quantity: stock_quantity || 0,
      min_stock: min_stock || 0,
      supplier: supplier || null,
      category: category || 'Sonstiges',
      is_active: true
    });

    res.status(201).json({
      success: true,
      data: ingredient
    });
  } catch (error) {
    console.error('Create ingredient error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen der Zutat',
      error: error.message
    });
  }
};

// @desc    Update ingredient
// @route   PUT /api/v1/ingredients/:id
// @access  Private
exports.updateIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findByPk(req.params.id);

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: 'Zutat nicht gefunden'
      });
    }

    await ingredient.update(req.body);

    res.json({
      success: true,
      data: ingredient
    });
  } catch (error) {
    console.error('Update ingredient error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren der Zutat',
      error: error.message
    });
  }
};

// @desc    Delete ingredient
// @route   DELETE /api/v1/ingredients/:id
// @access  Private
exports.deleteIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.findByPk(req.params.id);

    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: 'Zutat nicht gefunden'
      });
    }

    await ingredient.destroy();

    res.json({
      success: true,
      message: 'Zutat erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Delete ingredient error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen der Zutat',
      error: error.message
    });
  }
};

// @desc    Update ingredient stock
// @route   PATCH /api/v1/ingredients/:id/stock
// @access  Private (admin, manager)
exports.updateStock = async (req, res) => {
  try {
    const { quantity, operation } = req.body; // operation: 'add', 'subtract', or 'set'

    const ingredient = await Ingredient.findByPk(req.params.id);
    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: 'Zutat nicht gefunden'
      });
    }

    let newStock = ingredient.stock_quantity;
    if (operation === 'add') {
      newStock += quantity;
    } else if (operation === 'subtract') {
      newStock -= quantity;
    } else {
      newStock = quantity; // Direct set
    }

    await ingredient.update({ stock_quantity: Math.max(0, newStock) });

    res.json({
      success: true,
      message: 'Lagerbestand erfolgreich aktualisiert',
      data: ingredient
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren des Lagerbestands',
      error: error.message
    });
  }
};

// @desc    Get ingredients with low stock
// @route   GET /api/v1/ingredients/low-stock
// @access  Private (admin, manager)
exports.getLowStock = async (req, res) => {
  try {
    const ingredients = await Ingredient.findAll({
      where: {
        stock_quantity: {
          [Op.lte]: sequelize.col('min_stock')
        }
      },
      order: [['stock_quantity', 'ASC']]
    });

    res.json({
      success: true,
      count: ingredients.length,
      data: ingredients
    });
  } catch (error) {
    console.error('Get low stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Zutaten mit niedrigem Bestand',
      error: error.message
    });
  }
};