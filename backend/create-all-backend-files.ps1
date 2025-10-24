# backend/create-all-backend-files.ps1
Write-Host "🚀 Creating ALL backend files..." -ForegroundColor Green

# Erstelle Verzeichnisse
New-Item -ItemType Directory -Force -Path "src\controllers" | Out-Null
New-Item -ItemType Directory -Force -Path "src\models" | Out-Null
New-Item -ItemType Directory -Force -Path "src\routes" | Out-Null

Write-Host "📁 Directories created!" -ForegroundColor Yellow

# ==========================================
# 1. Product Model
# ==========================================
Write-Host "Creating Product.js..." -ForegroundColor Cyan
@"
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'products',
  timestamps: true
});

module.exports = Product;
"@ | Out-File -FilePath "src\models\Product.js" -Encoding UTF8

# ==========================================
# 2. Sale Model
# ==========================================
Write-Host "Creating Sale.js..." -ForegroundColor Cyan
@"
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Sale = sequelize.define('Sale', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    }
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_method: {
    type: DataTypes.ENUM('cash', 'card', 'online'),
    defaultValue: 'cash'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
    defaultValue: 'completed'
  },
  sale_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'sales',
  timestamps: true
});

module.exports = Sale;
"@ | Out-File -FilePath "src\models\Sale.js" -Encoding UTF8

# ==========================================
# 3. Models Index (ÜBERSCHREIBEN!)
# ==========================================
Write-Host "Updating models/index.js..." -ForegroundColor Cyan
@"
const sequelize = require('../config/database');
const User = require('./User');
const Product = require('./Product');
const Sale = require('./Sale');

// Define associations
Sale.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(Sale, { foreignKey: 'user_id', as: 'sales' });

Sale.belongsTo(Product, { foreignKey: 'product_id', as: 'product' });
Product.hasMany(Sale, { foreignKey: 'product_id', as: 'sales' });

module.exports = {
  sequelize,
  User,
  Product,
  Sale
};
"@ | Out-File -FilePath "src\models\index.js" -Encoding UTF8

# ==========================================
# 4. Product Controller
# ==========================================
Write-Host "Creating productController.js..." -ForegroundColor Cyan
@"
const { Product } = require('../models');
const { Op } = require('sequelize');

exports.getAllProducts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, search, category, is_available } = req.query;
    
    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where.name = { [Op.iLike]: ``%`${search}%`` };
    }

    if (category) {
      where.category = category;
    }

    if (is_available !== undefined) {
      where.is_available = is_available === 'true';
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        products: rows,
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        total: count,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produkt nicht gefunden'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

exports.createProduct = async (req, res, next) => {
  try {
    const { name, category, price, cost, description, is_available } = req.body;

    const product = await Product.create({
      name,
      category,
      price,
      cost,
      description,
      is_available
    });

    res.status(201).json({
      success: true,
      message: 'Produkt erstellt',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produkt nicht gefunden'
      });
    }

    await product.update(req.body);

    res.json({
      success: true,
      message: 'Produkt aktualisiert',
      data: product
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Produkt nicht gefunden'
      });
    }

    await product.destroy();

    res.json({
      success: true,
      message: 'Produkt gelöscht'
    });
  } catch (error) {
    next(error);
  }
};
"@ | Out-File -FilePath "src\controllers\productController.js" -Encoding UTF8

Write-Host "✅ All files created successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: node create-admin.js"
Write-Host "2. Run: npm start"
Write-Host ""