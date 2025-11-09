const { Category } = require('../models');
const { Op } = require('sequelize');

console.log('📁 Loading categoryController.js - is_active as information field');

// Get all categories for a restaurant (always show all, is_active is just info)
const getAllCategories = async (req, res) => {
  try {
    console.log('🔍 Getting all categories for user:', req.user?.id);
    
    const { page = 1, limit = 20, search } = req.query;
    const offset = (page - 1) * limit;
    
    const restaurantId = req.user?.restaurantId || req.user?.restaurant_id || req.user?.restaurant?.id;
    
    console.log('🏪 Restaurant ID:', restaurantId);
    
    if (!restaurantId) {
      console.log('❌ No restaurant ID found for user');
      return res.status(400).json({
        success: false,
        message: 'User is not associated with any restaurant'
      });
    }

    // Build where condition - DON'T filter by is_active (show all categories)
    const whereCondition = {
      restaurant_id: restaurantId  // Only filter by restaurant
    };

    // Add search condition if provided
    if (search) {
      whereCondition.name = {
        [Op.iLike]: `%${search}%`
      };
    }

    console.log('🔍 Query conditions:', whereCondition);

    const { rows: categories, count } = await Category.findAndCountAll({
      where: whereCondition,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['name', 'ASC']],
      attributes: ['id', 'name', 'description', 'color', 'is_active', 'created_at', 'updated_at']
    });

    console.log(`✅ Found ${count} categories (including active and on-hold)`);

    res.json({
      success: true,
      data: {
        categories: categories.map(cat => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
          color: cat.color,
          isActive: cat.is_active,  // This is just status info for reports
          status: cat.is_active ? 'Active' : 'On Hold',  // Readable status
          createdAt: cat.created_at,
          updatedAt: cat.updated_at
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(count / limit),
          totalItems: count,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Get all categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get category by ID
const getCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId || req.user?.restaurant_id || req.user?.restaurant?.id;
    
    console.log('🔍 Getting category:', id, 'for restaurant:', restaurantId);
    
    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with any restaurant'
      });
    }

    const category = await Category.findOne({
      where: {
        id,
        restaurant_id: restaurantId  // Don't filter by is_active
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        isActive: category.is_active,
        status: category.is_active ? 'Active' : 'On Hold',
        createdAt: category.created_at,
        updatedAt: category.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Get category by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create new category
const createCategory = async (req, res) => {
  try {
    const { name, description, color, isActive = true } = req.body;  // Default to active
    const restaurantId = req.user?.restaurantId || req.user?.restaurant_id || req.user?.restaurant?.id;
    
    console.log('➕ Creating category:', name, 'for restaurant:', restaurantId);
    console.log('📋 Request body:', req.body);
    
    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with any restaurant'
      });
    }

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const trimmedName = name.trim();

    // Check if category name already exists for this restaurant (regardless of active status)
    const existingCategory = await Category.findOne({
      where: {
        name: trimmedName,
        restaurant_id: restaurantId  // Only check name uniqueness per restaurant
      }
    });

    if (existingCategory) {
      console.log('❌ Category already exists:', {
        id: existingCategory.id,
        name: existingCategory.name,
        isActive: existingCategory.is_active
      });
      
      return res.status(409).json({
        success: false,
        message: `Category '${trimmedName}' already exists for this restaurant`,
        code: 'CATEGORY_NAME_EXISTS',
        data: {
          existingCategoryId: existingCategory.id,
          existingStatus: existingCategory.is_active ? 'Active' : 'On Hold'
        }
      });
    }

    // Create category using snake_case field names for database
    const categoryData = {
      name: trimmedName,
      description: description?.trim() || null,
      color: color || '#6B7280',
      restaurant_id: restaurantId,
      is_active: Boolean(isActive)  // Can be true or false, just status info
    };

    console.log('💾 Creating category with data:', categoryData);

    const category = await Category.create(categoryData);

    console.log('✅ Category created:', category.id);

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        id: category.id,
        name: category.name,
        description: category.description,
        color: category.color,
        isActive: category.is_active,
        status: category.is_active ? 'Active' : 'On Hold',
        createdAt: category.created_at
      }
    });

  } catch (error) {
    console.error('❌ Create category error:', error);
    
    // Handle specific Sequelize errors
    if (error.name === 'SequelizeUniqueConstraintError') {
      console.log('❌ Unique constraint violation detected');
      return res.status(409).json({
        success: false,
        message: 'Category with this name already exists for this restaurant',
        code: 'UNIQUE_CONSTRAINT_VIOLATION'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        name: error.name
      } : undefined
    });
  }
};

// Update category - FIXED for is_active status field
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      name, 
      description, 
      color, 
      is_active,    // from frontend (snake_case)
      isActive,     // from frontend (camelCase)  
      active,       // alternative naming
      status        // if frontend sends "Active"/"On Hold"
    } = req.body;
    
    const restaurantId = req.user?.restaurantId || req.user?.restaurant_id || req.user?.restaurant?.id;
    
    console.log('✏️ Updating category:', id);
    console.log('📝 Full request body:', JSON.stringify(req.body, null, 2));
    console.log('🏪 Restaurant ID:', restaurantId);
    
    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with any restaurant'
      });
    }

    // Find category using snake_case
    const category = await Category.findOne({
      where: {
        id,
        restaurant_id: restaurantId  // Don't filter by is_active
      }
    });

    if (!category) {
      console.log('❌ Category not found:', id);
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    console.log('📋 Current category before update:', {
      id: category.id,
      name: category.name,
      isActive: category.is_active,
      status: category.is_active ? 'Active' : 'On Hold'
    });

    // Check if new name conflicts with existing category (if name is being changed)
    if (name && name.trim() !== category.name) {
      const existingCategory = await Category.findOne({
        where: {
          name: name.trim(),
          restaurant_id: restaurantId,
          id: { [Op.ne]: id }  // Exclude current category
        }
      });

      if (existingCategory) {
        return res.status(409).json({
          success: false,
          message: 'Category with this name already exists'
        });
      }
    }

    // Build update data using snake_case for database
    const updateData = {};
    
    if (name !== undefined && name !== null) {
      updateData.name = name.trim();
      console.log('📝 Updating name to:', updateData.name);
    }
    
    if (description !== undefined) {
      updateData.description = description?.trim() || null;
      console.log('📝 Updating description to:', updateData.description);
    }
    
    if (color !== undefined && color !== null) {
      updateData.color = color;
      console.log('📝 Updating color to:', updateData.color);
    }
    
    // Handle active status - check all possible field names and formats
    let newActiveStatus = null;
    
    if (is_active !== undefined) {
      newActiveStatus = Boolean(is_active);
      console.log('🔄 Setting is_active from is_active:', is_active, '->', newActiveStatus);
    } else if (isActive !== undefined) {
      newActiveStatus = Boolean(isActive);
      console.log('🔄 Setting is_active from isActive:', isActive, '->', newActiveStatus);
    } else if (active !== undefined) {
      newActiveStatus = Boolean(active);
      console.log('🔄 Setting is_active from active:', active, '->', newActiveStatus);
    } else if (status !== undefined) {
      // Handle text status like "Active" or "On Hold"
      if (typeof status === 'string') {
        newActiveStatus = status.toLowerCase() === 'active';
        console.log('🔄 Setting is_active from status:', status, '->', newActiveStatus);
      } else {
        newActiveStatus = Boolean(status);
        console.log('🔄 Setting is_active from status (boolean):', status, '->', newActiveStatus);
      }
    }
    
    if (newActiveStatus !== null) {
      updateData.is_active = newActiveStatus;
    }

    console.log('💾 Final update data to apply:', updateData);

    // Perform the update using snake_case
    const [affectedRows] = await Category.update(updateData, {
      where: {
        id,
        restaurant_id: restaurantId
      }
    });

    console.log('📊 Affected rows:', affectedRows);

    if (affectedRows === 0) {
      console.log('❌ No rows were updated - possibly no changes detected');
      // Don't return error, just fetch current state
    }

    // Fetch updated category to return current state
    const updatedCategory = await Category.findOne({
      where: {
        id,
        restaurant_id: restaurantId
      }
    });

    console.log('✅ Category after update:', {
      id: updatedCategory.id,
      name: updatedCategory.name,
      isActive: updatedCategory.is_active,
      status: updatedCategory.is_active ? 'Active' : 'On Hold'
    });

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        id: updatedCategory.id,
        name: updatedCategory.name,
        description: updatedCategory.description,
        color: updatedCategory.color,
        isActive: updatedCategory.is_active,
        status: updatedCategory.is_active ? 'Active' : 'On Hold',
        updatedAt: updatedCategory.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Update category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: process.env.NODE_ENV === 'development' ? {
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }
};

// Delete category (real delete, not soft delete since is_active is just status info)
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user?.restaurantId || req.user?.restaurant_id || req.user?.restaurant?.id;
    
    console.log('🗑️ Deleting category:', id, 'for restaurant:', restaurantId);
    
    if (!restaurantId) {
      return res.status(400).json({
        success: false,
        message: 'User is not associated with any restaurant'
      });
    }

    const category = await Category.findOne({
      where: {
        id,
        restaurant_id: restaurantId
      }
    });

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Real delete since is_active is just status info, not soft delete indicator
    await Category.destroy({
      where: { 
        id, 
        restaurant_id: restaurantId 
      }
    });

    console.log('✅ Category deleted permanently:', category.id);

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });

  } catch (error) {
    console.error('❌ Delete category error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Export all functions
module.exports = {
  getAllCategories,
  getCategory,
  createCategory,
  updateCategory,
  deleteCategory
};

console.log('✅ categoryController.js loaded - is_active as information field only');