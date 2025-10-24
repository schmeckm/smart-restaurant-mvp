// backend/src/controllers/recipeController.js
const { Recipe, Product, Ingredient, RecipeIngredient, sequelize } = require('../models');

// @desc    Get all recipes
// @route   GET /api/v1/recipes
// @access  Private
exports.getRecipes = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await Recipe.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'category', 'price']
        },
        {
          model: Ingredient,
          as: 'ingredients',
          through: {
            attributes: ['quantity', 'unit']
          },
          attributes: ['id', 'name', 'unit', 'cost_per_unit', 'stock_quantity']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        recipes: rows,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        total: count,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get recipes error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Rezepte',
      error: error.message
    });
  }
};

// @desc    Get single recipe
// @route   GET /api/v1/recipes/:id
// @access  Private
exports.getRecipe = async (req, res) => {
  try {
    const recipe = await Recipe.findByPk(req.params.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'category', 'price', 'description']
        },
        {
          model: Ingredient,
          as: 'ingredients',
          through: {
            attributes: ['quantity', 'unit']
          },
          attributes: ['id', 'name', 'unit', 'cost_per_unit', 'stock_quantity']
        }
      ]
    });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Rezept nicht gefunden'
      });
    }

    res.json({
      success: true,
      data: recipe
    });
  } catch (error) {
    console.error('Get recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden des Rezepts',
      error: error.message
    });
  }
};

// @desc    Get recipe by product
// @route   GET /api/v1/recipes/product/:productId
// @access  Private
exports.getRecipeByProduct = async (req, res) => {
  try {
    const recipe = await Recipe.findOne({
      where: { productId: req.params.productId },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'category', 'price']
        },
        {
          model: Ingredient,
          as: 'ingredients',
          through: {
            attributes: ['quantity', 'unit']
          },
          attributes: ['id', 'name', 'unit', 'cost_per_unit', 'stock_quantity', 'supplier']
        }
      ]
    });

    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Kein Rezept für dieses Produkt gefunden'
      });
    }

    res.json({
      success: true,
      data: recipe
    });
  } catch (error) {
    console.error('Get recipe by product error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden des Rezepts',
      error: error.message
    });
  }
};

// @desc    Create recipe (AI-Compatible)
// @route   POST /api/v1/recipes
// @access  Private
exports.createRecipe = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    console.log('📥 CREATE RECIPE - Request body:', JSON.stringify(req.body, null, 2));
    
    const {
      productId,
      product_id,
      name,
      description,
      instructions,
      prepTime,
      prep_time,
      cookTime,
      cook_time,
      servings,
      difficulty,
      cuisine,
      tags,
      nutrition,
      isActive,
      ingredients
    } = req.body;

    // Accept both camelCase and snake_case
    const finalProductId = productId || product_id;
    const finalPrepTime = prepTime || prep_time || 0;
    const finalCookTime = cookTime || cook_time || 0;
    
    console.log('📦 Extracted product_id:', finalProductId);

    if (!finalProductId) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'product_id oder productId ist erforderlich'
      });
    }

    // 1. Validate product exists
    console.log('🔍 Searching for product with ID:', finalProductId);
    const product = await Product.findByPk(finalProductId);
    
    if (!product) {
      console.log('❌ Product NOT found in database');
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Produkt nicht gefunden'
      });
    }

    console.log('✅ Product found:', product.name);

    // 2. Create recipe
    const recipeData = {
      productId: finalProductId,
      name: name || product.name,
      description: description || '',
      instructions: Array.isArray(instructions) ? JSON.stringify(instructions) : instructions,
      prepTime: finalPrepTime,
      cookTime: finalCookTime,
      servings: servings || 1,
      difficulty: difficulty || 'mittel',
      cuisine: cuisine || 'International',
      tags: Array.isArray(tags) ? JSON.stringify(tags) : (tags || null),
      nutrition: nutrition ? JSON.stringify(nutrition) : null,
      isActive: isActive !== undefined ? isActive : true
    };

    console.log('📝 Creating recipe...');
    
    const recipe = await Recipe.create(recipeData, { transaction });

    console.log('✅ Recipe created with ID:', recipe.id);

    await transaction.commit();
    console.log('✅ Transaction committed');

    // Fetch created recipe with relations
    const createdRecipe = await Recipe.findByPk(recipe.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'category', 'price']
        }
      ]
    });

    console.log('✅ Sending success response');

    res.status(201).json({
      success: true,
      data: createdRecipe
    });

  } catch (error) {
    if (!transaction.finished) {
      await transaction.rollback();
    }
    console.error('❌ Create recipe error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen des Rezepts',
      error: error.message
    });
  }
};

// @desc    Update recipe
// @route   PUT /api/v1/recipes/:id
// @access  Private
exports.updateRecipe = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { instructions, preparationTime, servings, ingredients } = req.body;

    const recipe = await Recipe.findByPk(req.params.id);
    if (!recipe) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Rezept nicht gefunden'
      });
    }

    await recipe.update({
      instructions: instructions || recipe.instructions,
      preparationTime: preparationTime !== undefined ? preparationTime : recipe.preparationTime,
      servings: servings !== undefined ? servings : recipe.servings
    }, { transaction });

    if (ingredients && Array.isArray(ingredients)) {
      await RecipeIngredient.destroy({
        where: { recipeId: recipe.id },
        transaction
      });

      if (ingredients.length > 0) {
        const recipeIngredients = ingredients.map(ing => ({
          recipeId: recipe.id,
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unit: ing.unit
        }));

        await RecipeIngredient.bulkCreate(recipeIngredients, { transaction });
      }
    }

    await transaction.commit();

    const updatedRecipe = await Recipe.findByPk(recipe.id, {
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'category', 'price']
        },
        {
          model: Ingredient,
          as: 'ingredients',
          through: {
            attributes: ['quantity', 'unit']
          },
          attributes: ['id', 'name', 'unit', 'cost_per_unit', 'stock_quantity']
        }
      ]
    });

    res.json({
      success: true,
      message: 'Rezept erfolgreich aktualisiert',
      data: updatedRecipe
    });
  } catch (error) {
    if (transaction && !transaction.finished) {
      await transaction.rollback();
    }
    console.error('Update recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren des Rezepts',
      error: error.message
    });
  }
};

// @desc    Delete recipe
// @route   DELETE /api/v1/recipes/:id
// @access  Private
exports.deleteRecipe = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const recipe = await Recipe.findByPk(req.params.id);

    if (!recipe) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Rezept nicht gefunden'
      });
    }

    await RecipeIngredient.destroy({
      where: { recipeId: recipe.id },
      transaction
    });

    await recipe.destroy({ transaction });
    await transaction.commit();

    res.json({
      success: true,
      message: 'Rezept erfolgreich gelöscht'
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Delete recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen des Rezepts',
      error: error.message
    });
  }
};

// @desc    Add ingredient to recipe
// @route   POST /api/v1/recipes/:id/ingredients
// @access  Private
// @desc    Add ingredient to recipe
// @route   POST /api/v1/recipes/:id/ingredients
// @access  Private
exports.addIngredientToRecipe = async (req, res) => {
  try {
    const { ingredientId, ingredient_id, quantity, unit, notes } = req.body;
    const finalIngredientId = ingredientId || ingredient_id;

    console.log(`🔧 Adding ingredient ${finalIngredientId} to recipe ${req.params.id}`);

    if (!finalIngredientId || !quantity || !unit) {
      return res.status(400).json({
        success: false,
        message: 'ingredientId, quantity und unit sind erforderlich'
      });
    }

    const recipe = await Recipe.findByPk(req.params.id);
    if (!recipe) {
      return res.status(404).json({
        success: false,
        message: 'Rezept nicht gefunden'
      });
    }

    const ingredient = await Ingredient.findByPk(finalIngredientId);
    if (!ingredient) {
      return res.status(404).json({
        success: false,
        message: 'Zutat nicht gefunden'
      });
    }

    try {
      // ✅ Versuche zu erstellen - DB verhindert Duplikate via Constraint
      await RecipeIngredient.create({
        recipeId: req.params.id,
        ingredientId: finalIngredientId,
        quantity: parseFloat(quantity),
        unit: unit
      });

      console.log('✅ Ingredient linked successfully');

      const updatedRecipe = await Recipe.findByPk(req.params.id, {
        include: [
          {
            model: Product,
            as: 'product',
            attributes: ['id', 'name', 'category', 'price']
          },
          {
            model: Ingredient,
            as: 'ingredients',
            through: {
              attributes: ['quantity', 'unit']
            },
            attributes: ['id', 'name', 'unit', 'cost_per_unit', 'stock_quantity']
          }
        ]
      });

      res.json({
        success: true,
        message: 'Zutat erfolgreich zum Rezept hinzugefügt',
        data: updatedRecipe
      });

    } catch (createError) {
      // ✅ Wenn Duplikat: Update statt Fehler
      if (createError.name === 'SequelizeUniqueConstraintError') {
        console.log('⚠️ Ingredient already exists, updating quantity...');
        
        // Update existing ingredient quantity
        const existing = await RecipeIngredient.findOne({
          where: { 
            recipeId: req.params.id,
            ingredientId: finalIngredientId
          }
        });

        if (existing) {
          await existing.update({
            quantity: parseFloat(quantity),
            unit: unit
          });

          const updatedRecipe = await Recipe.findByPk(req.params.id, {
            include: [
              {
                model: Product,
                as: 'product',
                attributes: ['id', 'name', 'category', 'price']
              },
              {
                model: Ingredient,
                as: 'ingredients',
                through: {
                  attributes: ['quantity', 'unit']
                },
                attributes: ['id', 'name', 'unit', 'cost_per_unit', 'stock_quantity']
              }
            ]
          });

          return res.json({
            success: true,
            message: 'Zutat bereits vorhanden - Menge aktualisiert',
            data: updatedRecipe
          });
        }
      }
      
      // Andere Fehler weiterwerfen
      throw createError;
    }

  } catch (error) {
    console.error('Add ingredient to recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Hinzufügen der Zutat',
      error: error.message
    });
  }
};

// Placeholder functions
exports.updateRecipeIngredient = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

exports.removeIngredientFromRecipe = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

exports.calculateRecipeCost = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};

exports.checkRecipeStock = async (req, res) => {
  res.status(501).json({ success: false, message: 'Not implemented yet' });
};