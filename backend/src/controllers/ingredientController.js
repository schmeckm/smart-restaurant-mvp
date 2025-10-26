// backend/src/controllers/ingredientController.js
// Fixed Ingredient Controller with proper pagination

const { Ingredient, sequelize } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all ingredients with pagination
 */
exports.getAllIngredients = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20, 
      search, 
      isActive,
      lowStock 
    } = req.query;
    
    const offset = (page - 1) * limit;
    
    const where = {};
    
    // Search filter
    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }
    
    // Active filter
    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }
    
    // Low stock filter
    if (lowStock === 'true') {
      // Ingredients where stock is below minimum
      where[Op.and] = sequelize.literal('"stock_quantity" <= "min_stock"');
    }
    
    const { count, rows } = await Ingredient.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']]
    });
    
    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching ingredients:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ingredients',
      error: error.message
    });
  }
};

/**
 * Get single ingredient
 */
exports.getIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ingredient = await Ingredient.findByPk(id);
    
    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: 'Ingredient not found'
      });
    }
    
    res.json({
      success: true,
      data: ingredient
    });
  } catch (error) {
    console.error('❌ Error fetching ingredient:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching ingredient',
      error: error.message
    });
  }
};

/**
 * Create ingredient
 */
exports.createIngredient = async (req, res) => {
  try {
    const ingredient = await Ingredient.create(req.body);
    
    res.status(201).json({
      success: true,
      data: ingredient,
      message: 'Ingredient created successfully'
    });
  } catch (error) {
    console.error('❌ Error creating ingredient:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating ingredient',
      error: error.message
    });
  }
};

/**
 * Update ingredient
 */
exports.updateIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ingredient = await Ingredient.findByPk(id);
    
    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: 'Ingredient not found'
      });
    }
    
    await ingredient.update(req.body);
    
    res.json({
      success: true,
      data: ingredient,
      message: 'Ingredient updated successfully'
    });
  } catch (error) {
    console.error('❌ Error updating ingredient:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating ingredient',
      error: error.message
    });
  }
};

/**
 * Delete ingredient
 */
exports.deleteIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    
    const ingredient = await Ingredient.findByPk(id);
    
    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: 'Ingredient not found'
      });
    }
    
    await ingredient.destroy();
    
    res.json({
      success: true,
      message: 'Ingredient deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting ingredient:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting ingredient',
      error: error.message
    });
  }
};

/**
 * Bulk delete ingredients
 */
exports.bulkDeleteIngredients = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No ingredient IDs provided'
      });
    }
    
    const deleted = await Ingredient.destroy({
      where: {
        id: { [Op.in]: ids }
      }
    });
    
    res.json({
      success: true,
      message: `${deleted} ingredient(s) deleted successfully`,
      deletedCount: deleted
    });
  } catch (error) {
    console.error('❌ Error bulk deleting ingredients:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting ingredients',
      error: error.message
    });
  }
};

/**
 * Get low stock ingredients
 */
exports.getLowStockIngredients = async (req, res) => {
  try {
    // Use static method from model
    const ingredients = await Ingredient.getLowStockIngredients();
    
    res.json({
      success: true,
      data: ingredients,
      count: ingredients.length
    });
  } catch (error) {
    console.error('❌ Error fetching low stock ingredients:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching low stock ingredients',
      error: error.message
    });
  }
};