// backend/src/models/DemandInsight.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const DemandInsight = sequelize.define('DemandInsight', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    restaurantId: { type: DataTypes.UUID, allowNull: false },
    date: { type: DataTypes.DATEONLY, allowNull: false },
    location: { type: DataTypes.STRING(100), allowNull: true },
    summary: { type: DataTypes.STRING(500), allowNull: true },
    data: { type: DataTypes.JSONB, allowNull: false }
  }, {
    tableName: 'demand_insights',
    timestamps: true,
    underscored: true
  });

  return DemandInsight;
};
