const { Category } = require('../models');
const { Op } = require('sequelize');

// @desc    Get all categories
// @route   GET /api/v1/categories
// @access  Private
exports.getAllCategories = async (req, res, next) => {
  try {
    const { search, is_active } = req.query;
    
    const where = {};

    if (search) {
      where.name = { [Op.iLike]: `%${search}%` };
    }

    if (is_active !== undefined) {
      where.is_active = is_active === 'true';
    }

    const categories = await Category.findAll({
      where,
      order: [['sort_order', 'ASC'], ['name', 'ASC']]
    });

    res.json({
      success: true,
      data: {
        categories,
        total: categories.length
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single category
// @route   GET /api/v1/categories/:id
// @access  Private
exports.getCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategorie nicht gefunden'
      });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create category
// @route   POST /api/v1/categories
// @access  Private (admin/manager)
exports.createCategory = async (req, res, next) => {
  try {
    const { name, description, color, icon, sort_order } = req.body;

    // Check if category exists
    const existingCategory = await Category.findOne({ where: { name } });
    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: 'Kategorie existiert bereits'
      });
    }

    const category = await Category.create({
      name,
      description,
      color,
      icon,
      sort_order
    });

    res.status(201).json({
      success: true,
      message: 'Kategorie erstellt',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update category
// @route   PUT /api/v1/categories/:id
// @access  Private (admin/manager)
exports.updateCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategorie nicht gefunden'
      });
    }

    await category.update(req.body);

    res.json({
      success: true,
      message: 'Kategorie aktualisiert',
      data: category
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete category
// @route   DELETE /api/v1/categories/:id
// @access  Private (admin)
exports.deleteCategory = async (req, res, next) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Kategorie nicht gefunden'
      });
    }

    // Check if category is used by products
    const { Product } = require('../models');
    const productsCount = await Product.count({
      where: { category: category.name }
    });

    if (productsCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Kategorie wird von ${productsCount} Produkt(en) verwendet`
      });
    }

    await category.destroy();

    res.json({
      success: true,
      message: 'Kategorie gelöscht'
    });
  } catch (error) {
    next(error);
  }
};