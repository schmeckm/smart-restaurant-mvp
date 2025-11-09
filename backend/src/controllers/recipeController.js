// backend/src/controllers/recipeController.js
// Recipe Controller – Recipes are Products with instructions/recipe fields

const { Product, Category, Ingredient, ProductIngredient } = require('../models');
const { Op } = require('sequelize');

// ==========================================================
// @desc    Get all recipes
// @route   GET /api/v1/recipes
// @access  Private
// ==========================================================
exports.getAllRecipes = async (req, res) => {
  try {
    const restaurantId = req.user ? req.user.restaurantId : 1;

    const recipes = await Product.findAll({
      where: {
        restaurantId,
        isActive: true,
        instructions: { [Op.ne]: null }
      },
      include: [
        {
          model: Category,
          as: 'category',
          attributes: ['id', 'name', 'color', 'icon']
        },
        {
          model: Ingredient,
          as: 'ingredients',
          through: { attributes: ['quantity', 'unit', 'preparationNote', 'sortOrder'] },
          attributes: ['id', 'name', 'unit', 'pricePerUnit']
        }
      ],
      order: [['sortOrder', 'ASC'], ['name', 'ASC']]
    });

    res.json({ success: true, count: recipes.length, data: recipes });
  } catch (error) {
    console.error('❌ Get all recipes error:', error);
    res.status(500).json({ success: false, message: 'Fehler beim Laden der Rezepte' });
  }
};

// ==========================================================
// @desc    Get single recipe
// @route   GET /api/v1/recipes/:id
// @access  Private
// ==========================================================
exports.getRecipe = async (req, res) => {
  try {
    const restaurantId = req.user ? req.user.restaurantId : 1;

    const recipe = await Product.findOne({
      where: {
        id: req.params.id,
        restaurantId,
        instructions: { [Op.ne]: null }
      },
      include: [
        { model: Category, as: 'category' },
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
      return res.status(404).json({ success: false, message: 'Rezept nicht gefunden' });
    }

    res.json({ success: true, data: recipe });
  } catch (error) {
    console.error('❌ Get recipe error:', error);
    res.status(500).json({ success: false, message: 'Fehler beim Laden des Rezepts' });
  }
};

// ==========================================================
// @desc    Create recipe
// @route   POST /api/v1/recipes
// @access  Private (admin/manager)
// ==========================================================
exports.createRecipe = async (req, res) => {
  try {
    const restaurantId = req.user ? req.user.restaurantId : 1;

    const recipeData = {
      ...req.body,
      restaurantId,
      instructions: req.body.instructions || '',
      prepTime: req.body.prepTime || 0,
      cookTime: req.body.cookTime || 0,
      servings: req.body.servings || 1,
      difficulty: req.body.difficulty || 'medium'
    };

    const recipe = await Product.create(recipeData);

    if (req.body.ingredients && req.body.ingredients.length > 0) {
      for (const ingredient of req.body.ingredients) {
        const ingredientExists = await Ingredient.findOne({
          where: { id: ingredient.ingredientId, restaurantId }
        });

        if (!ingredientExists) {
          await recipe.destroy();
          return res.status(400).json({
            success: false,
            message: `Zutat mit ID ${ingredient.ingredientId} nicht gefunden oder gehört nicht zu Ihrem Restaurant`
          });
        }

        await ProductIngredient.create({
          productId: recipe.id,
          ingredientId: ingredient.ingredientId,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          preparationNote: ingredient.preparationNote,
          isOptional: ingredient.isOptional || false,
          sortOrder: ingredient.sortOrder || 0
        });
      }
    }

    const completeRecipe = await Product.findByPk(recipe.id, {
      include: [
        { model: Category, as: 'category' },
        {
          model: Ingredient,
          as: 'ingredients',
          through: { attributes: ['quantity', 'unit', 'preparationNote'] }
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Rezept erfolgreich erstellt',
      data: completeRecipe
    });
  } catch (error) {
    console.error('❌ Create recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen des Rezepts',
      error: error.message
    });
  }
};

// ==========================================================
// @desc    Update recipe
// @route   PUT /api/v1/recipes/:id
// @access  Private (admin/manager)
// ==========================================================
exports.updateRecipe = async (req, res) => {
  try {
    const restaurantId = req.user ? req.user.restaurantId : 1;

    // 🔍 Rezept laden
    const recipe = await Product.findOne({
      where: { id: req.params.id, restaurantId, instructions: { [Op.ne]: null } }
    });

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Rezept nicht gefunden' });
    }

    // 🔄 Eingehende Daten aufbereiten
    const { ingredients, ...updateData } = req.body;

    // 🩹 Fix: Leere Strings → null (z. B. category_id)
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === '') updateData[key] = null;
    });
    if (updateData.category_id === '') updateData.category_id = null;

    // 📝 Rezeptdaten aktualisieren
    await recipe.update(updateData);

    // 🧾 Zutaten aktualisieren
    if (ingredients) {
      await ProductIngredient.destroy({ where: { productId: recipe.id } });

      for (const ingredient of ingredients) {
        const ingredientExists = await Ingredient.findOne({
          where: { id: ingredient.ingredientId, restaurantId }
        });

        if (!ingredientExists) {
          return res.status(400).json({
            success: false,
            message: `Zutat mit ID ${ingredient.ingredientId} nicht gefunden`
          });
        }

        await ProductIngredient.create({
          productId: recipe.id,
          ingredientId: ingredient.ingredientId,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
          preparationNote: ingredient.preparationNote,
          isOptional: ingredient.isOptional || false,
          sortOrder: ingredient.sortOrder || 0
        });
      }
    }

    // 🔁 Vollständiges aktualisiertes Rezept laden
    const updatedRecipe = await Product.findByPk(recipe.id, {
      include: [
        { model: Category, as: 'category' },
        {
          model: Ingredient,
          as: 'ingredients',
          through: { attributes: ['quantity', 'unit', 'preparationNote'] }
        }
      ]
    });

    res.json({
      success: true,
      message: 'Rezept erfolgreich aktualisiert',
      data: updatedRecipe
    });
  } catch (error) {
    console.error('❌ Update recipe error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren des Rezepts',
      error: error.message
    });
  }
};

// ==========================================================
// @desc    Get recipe by product ID
// @route   GET /api/v1/recipes/product/:productId
// @access  Private
// ==========================================================
exports.getRecipeByProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    console.log('🔍 Fetching recipe for product:', productId);

    const product = await Product.findOne({
      where: { id: productId, restaurantId: req.user.restaurantId },
      include: [
        {
          model: ProductIngredient,
          as: 'productIngredients',
          include: [
            {
              model: Ingredient,
              as: 'ingredient',
              attributes: [
                'id',
                'name',
                'unit',
                'stockQuantity',
                'pricePerUnit',
                'supplier'
              ]
            }
          ]
        }
      ]
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Kein Rezept für Produkt mit ID ${productId} gefunden`
      });
    }

    const formattedRecipe = {
      id: product.id,
      name: product.name,
      description: product.description,
      productId: product.id,
      servingSize: 1,
      ingredients: product.productIngredients?.map(pi => {
        const ing = pi.ingredient;
        const quantity = parseFloat(pi.quantity || 0);
        const costPerUnit = parseFloat(ing?.pricePerUnit || 0);
        const totalCost = parseFloat((quantity * costPerUnit).toFixed(2));

        return {
          id: ing.id,
          name: ing.name,
          unit: ing.unit,
          supplier: ing.supplier,
          stock_quantity: parseFloat(ing.stockQuantity || 0),
          stockQuantity: parseFloat(ing.stockQuantity || 0),
          cost_per_unit: costPerUnit,
          costPerUnit: costPerUnit,
          totalCost,
          RecipeIngredient: {
            quantity,
            unit: pi.unit || ing.unit
          },
          quantity,
          isOptional: pi.isOptional || false
        };
      }) || []
    };

    formattedRecipe.totalRecipeCost = formattedRecipe.ingredients
      .reduce((sum, ing) => sum + (parseFloat(ing.totalCost) || 0), 0)
      .toFixed(2);

    console.log(`✅ Recipe: ${product.name}, total cost: ${formattedRecipe.totalRecipeCost}`);

    res.json({ success: true, data: formattedRecipe });
  } catch (error) {
    console.error('❌ Get recipe by product error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden des Rezepts',
      error: error.message
    });
  }
};

// ==========================================================
// @desc    Delete recipe
// @route   DELETE /api/v1/recipes/:id
// @access  Private (admin)
// ==========================================================
exports.deleteRecipe = async (req, res) => {
  try {
    const restaurantId = req.user ? req.user.restaurantId : 1;

    const recipe = await Product.findOne({
      where: { id: req.params.id, restaurantId, instructions: { [Op.ne]: null } }
    });

    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Rezept nicht gefunden' });
    }

    await recipe.update({ isActive: false });

    res.json({ success: true, message: 'Rezept erfolgreich gelöscht', data: {} });
  } catch (error) {
    console.error('❌ Delete recipe error:', error);
    res.status(500).json({ success: false, message: 'Fehler beim Löschen des Rezepts' });
  }
};
