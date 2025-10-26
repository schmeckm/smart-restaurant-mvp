// backend/src/controllers/recipeController.js
// Recipe Controller - Recipes ARE Products in our new architecture!

const { Product, Category, Ingredient, ProductIngredient } = require('../models');

/**
 * Get all recipes (= products with instructions)
 * Recipes are just products that have cooking instructions
 */
exports.getAllRecipes = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category } = req.query;
    const offset = (page - 1) * limit;

    const where = {
      isActive: true
    };

    // Only show products with instructions (= recipes)
    where.instructions = { [require('sequelize').Op.ne]: null };

    if (search) {
      where.name = { [require('sequelize').Op.iLike]: `%${search}%` };
    }

    if (category) {
      where.categoryId = category;
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: 'category'
        },
        {
          model: Ingredient,
          as: 'ingredients',
          through: {
            attributes: ['quantity', 'unit', 'preparationNote', 'isOptional', 'sortOrder']
          }
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']],
      distinct: true
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
    console.error('❌ Error fetching recipes:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recipes',
      error: error.message
    });
  }
};

/**
 * Get single recipe (= product with instructions)
 */
exports.getRecipe = async (req, res) => {
  try {
    const { id } = req.params;

    const recipe = await Product.findOne({
      where: {
        id,
        instructions: { [require('sequelize').Op.ne]: null }
      },
      include: [
        {
          model: Category,
          as: 'category'
        },
        {
          model: Ingredient,
          as: 'ingredients',
          through: {
            attributes: ['quantity', 'unit', 'preparationNote', 'isOptional', 'sortOrder']
          }
        }
      ]
    });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Recipe not found'
      });
    }

    res.json({
      success: true,
      data: recipe
    });
  } catch (error) {
    console.error('❌ Error fetching recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching recipe',
      error: error.message
    });
  }
};

/**
 * Create recipe (= create product with instructions)
 */
exports.createRecipe = async (req, res) => {
  try {
    const productData = req.body;
    
    // Ensure it has instructions (required for a recipe)
    if (!productData.instructions) {
      return res.status(400).json({
        success: false,
        message: 'Instructions are required for a recipe'
      });
    }

    // Create via product controller
    const productController = require('./productController');
    return productController.createProduct(req, res);
  } catch (error) {
    console.error('❌ Error creating recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating recipe',
      error: error.message
    });
  }
};

/**
 * Update recipe (= update product)
 */
exports.updateRecipe = async (req, res) => {
  try {
    // Update via product controller
    const productController = require('./productController');
    return productController.updateProduct(req, res);
  } catch (error) {
    console.error('❌ Error updating recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating recipe',
      error: error.message
    });
  }
};

/**
 * Delete recipe (= delete product)
 */
exports.deleteRecipe = async (req, res) => {
  try {
    const productController = require('./productController');
    return productController.deleteProduct(req, res);
  } catch (error) {
    console.error('❌ Error deleting recipe:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting recipe',
      error: error.message
    });
  }
};