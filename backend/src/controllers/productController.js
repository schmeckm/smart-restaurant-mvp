// backend/src/controllers/productController.js
// Example Controller using the fixed UUID models

const { Product, Ingredient, ProductIngredient, Category, Nutrition } = require('../models');
const { Op } = require('sequelize');

/**
 * @desc    Get all products with ingredients and nutrition
 * @route   GET /api/v1/products
 * @access  Public
 */
exports.getAllProducts = async (req, res) => {
  try {
    const { 
      category, 
      isActive = true, 
      search,
      page = 1,
      limit = 10
    } = req.query;

    // Build filter
    const where = { isActive };
    
    if (category) {
      where.categoryId = category;
    }

    if (search) {
      where[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Pagination
    const offset = (page - 1) * limit;

    const { count, rows: products } = await Product.findAndCountAll({
      where,
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color', 'icon']
        },
        {
          model: Ingredient,
          as: 'ingredients',
          through: {
            attributes: ['quantity', 'unit', 'preparationNote', 'isOptional']
          }
        }
      ],
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['sortOrder', 'ASC'], ['name', 'ASC']],
      distinct: true
    });

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Error fetching products:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
};

/**
 * @desc    Get single product with full details
 * @route   GET /api/v1/products/:id
 * @access  Public
 */
exports.getProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
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

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Calculate additional info
    const cost = await product.calculateCost();
    const margin = await product.getMargin();
    const nutrition = await product.calculateNutrition();
    const availability = await product.checkIngredientsAvailability();

    res.status(200).json({
      success: true,
      data: {
        ...product.toJSON(),
        calculated: {
          cost,
          margin,
          nutrition,
          availability,
          totalTime: product.getTotalTime()
        }
      }
    });
  } catch (error) {
    console.error('❌ Error fetching product:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
};

/**
 * @desc    Create new product with recipe
 * @route   POST /api/v1/products
 * @access  Private/Admin
 */
exports.createProduct = async (req, res) => {
  const transaction = await Product.sequelize.transaction();
  
  try {
    const {
      name,
      description,
      categoryId,
      price,
      instructions,
      prepTime,
      cookTime,
      servings,
      difficulty,
      tags,
      imageUrl,
      isActive,
      ingredients // Array: [{ ingredientId, quantity, unit, preparationNote, isOptional }]
    } = req.body;

    // Validate required fields
    if (!name || !price) {
      return res.status(400).json({
        success: false,
        message: 'Name and price are required'
      });
    }

    // Create product
    const product = await Product.create({
      name,
      description,
      categoryId,
      price,
      instructions,
      prepTime,
      cookTime,
      servings,
      difficulty,
      tags,
      imageUrl,
      isActive
    }, { transaction });

    // Add ingredients (recipe)
    if (ingredients && ingredients.length > 0) {
      const productIngredients = ingredients.map((ing, index) => ({
        productId: product.id,
        ingredientId: ing.ingredientId,
        quantity: ing.quantity,
        unit: ing.unit || 'g',
        preparationNote: ing.preparationNote,
        isOptional: ing.isOptional || false,
        sortOrder: ing.sortOrder || index
      }));

      await ProductIngredient.bulkCreate(productIngredients, { transaction });
    }

    await transaction.commit();

    // Fetch complete product data
    const createdProduct = await Product.findByPk(product.id, {
      include: [
        {
          model: Category,
          as: 'category'
        },
        {
          model: Ingredient,
          as: 'ingredients',
          through: {
            attributes: ['quantity', 'unit', 'preparationNote', 'isOptional']
          }
        }
      ]
    });

    res.status(201).json({
      success: true,
      data: createdProduct,
      message: 'Product created successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error creating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating product',
      error: error.message
    });
  }
};

/**
 * @desc    Update product and recipe
 * @route   PUT /api/v1/products/:id
 * @access  Private/Admin
 */
exports.updateProduct = async (req, res) => {
  const transaction = await Product.sequelize.transaction();
  
  try {
    const { id } = req.params;
    const {
      name,
      description,
      categoryId,
      price,
      instructions,
      prepTime,
      cookTime,
      servings,
      difficulty,
      tags,
      imageUrl,
      isActive,
      ingredients
    } = req.body;

    // Find product
    const product = await Product.findByPk(id);
    
    if (!product) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Update product
    await product.update({
      name,
      description,
      categoryId,
      price,
      instructions,
      prepTime,
      cookTime,
      servings,
      difficulty,
      tags,
      imageUrl,
      isActive
    }, { transaction });

    // Update ingredients if provided
    if (ingredients !== undefined) {
      // Delete old ingredients
      await ProductIngredient.destroy({
        where: { productId: id },
        transaction
      });

      // Add new ingredients
      if (ingredients.length > 0) {
        const productIngredients = ingredients.map((ing, index) => ({
          productId: id,
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit || 'g',
          preparationNote: ing.preparationNote,
          isOptional: ing.isOptional || false,
          sortOrder: ing.sortOrder || index
        }));

        await ProductIngredient.bulkCreate(productIngredients, { transaction });
      }
    }

    await transaction.commit();

    // Fetch updated product
    const updatedProduct = await Product.findByPk(id, {
      include: [
        {
          model: Category,
          as: 'category'
        },
        {
          model: Ingredient,
          as: 'ingredients',
          through: {
            attributes: ['quantity', 'unit', 'preparationNote', 'isOptional']
          }
        }
      ]
    });

    res.status(200).json({
      success: true,
      data: updatedProduct,
      message: 'Product updated successfully'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Error updating product:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating product',
      error: error.message
    });
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/v1/products/:id
 * @access  Private/Admin
 */
exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Soft delete (set isActive to false)
    await product.update({ isActive: false });

    // Or hard delete:
    // await product.destroy();

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully'
    });
  } catch (error) {
    console.error('❌ Error deleting product:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting product',
      error: error.message
    });
  }
};

/**
 * @desc    Check product availability (ingredients in stock)
 * @route   GET /api/v1/products/:id/availability
 * @access  Public
 */
exports.checkAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity = 1 } = req.query;

    const product = await Product.findByPk(id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const availability = await product.checkIngredientsAvailability(parseInt(quantity));

    const isAvailable = availability.every(item => item.isAvailable);

    res.status(200).json({
      success: true,
      data: {
        productId: id,
        productName: product.name,
        quantityRequested: parseInt(quantity),
        isAvailable,
        ingredients: availability
      }
    });
  } catch (error) {
    console.error('❌ Error checking availability:', error);
    res.status(500).json({
      success: false,
      message: 'Error checking availability',
      error: error.message
    });
  }
};

/**
 * @desc    Get product cost analysis
 * @route   GET /api/v1/products/:id/cost-analysis
 * @access  Private
 */
exports.getCostAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await Product.findByPk(id, {
      include: [
        {
          model: Ingredient,
          as: 'ingredients',
          through: {
            attributes: ['quantity', 'unit']
          }
        }
      ]
    });
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    const recipe = await product.getRecipe();
    const ingredientCosts = recipe.map(item => ({
      ingredientName: item.ingredient?.name,
      quantity: item.quantity,
      unit: item.unit,
      pricePerUnit: item.ingredient?.pricePerUnit,
      totalCost: item.calculateCost()
    }));

    const margin = await product.getMargin();

    res.status(200).json({
      success: true,
      data: {
        productId: id,
        productName: product.name,
        sellingPrice: product.price,
        ingredients: ingredientCosts,
        ...margin
      }
    });
  } catch (error) {
    console.error('❌ Error analyzing costs:', error);
    res.status(500).json({
      success: false,
      message: 'Error analyzing costs',
      error: error.message
    });
  }
};

module.exports = exports;