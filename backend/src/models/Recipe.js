// backend/src/models/Recipe.js
module.exports = (sequelize, DataTypes) => {
  const Recipe = sequelize.define('Recipe', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    productId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'product_id',
      references: {
        model: 'products',
        key: 'id'
      }
    },
    name: {
      type: DataTypes.STRING,
      allowNull: true
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    instructions: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    prepTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'prep_time'
    },
    cookTime: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'cook_time'
    },
    servings: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
      field: 'portions'
    },
    difficulty: {
      type: DataTypes.STRING,
      allowNull: true
    },
    cuisine: {
      type: DataTypes.STRING,
      allowNull: true
    },
    tags: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    nutrition: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'recipes',
    timestamps: true,
    underscored: false
  });

  Recipe.associate = (models) => {
    Recipe.belongsTo(models.Product, { as: 'product', foreignKey: 'productId' });
    Recipe.belongsToMany(models.Ingredient, {
      through: models.RecipeIngredient,
      as: 'ingredients',
      foreignKey: 'recipeId'
    });
  };

  return Recipe;
};
