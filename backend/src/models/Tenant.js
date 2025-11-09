// backend/models/Tenant.js
const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 *   schemas:
 *     Tenant:
 *       type: object
 *       description: Mandant (SaaS Tenant), repräsentiert ein Restaurant-Unternehmen
 *       required:
 *         - name
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "e2a6b8b3-8d42-4a4a-8bde-f8a3f0dc3cbb"
 *         name:
 *           type: string
 *           example: "Demo Tenant GmbH"
 *         contactEmail:
 *           type: string
 *           example: "info@demo-tenant.ch"
 *         contactPhone:
 *           type: string
 *           example: "+41 44 123 45 67"
 *         billingAddress:
 *           type: string
 *           example: "Musterweg 1, 8000 Zürich"
 *         isActive:
 *           type: boolean
 *           example: true
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
module.exports = (sequelize) => {
  const Tenant = sequelize.define(
    'Tenant',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      contactEmail: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isEmail: true },
      },
      contactPhone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      billingAddress: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'tenants',
      timestamps: true,
      underscored: true,
    }
  );

  Tenant.associate = (models) => {
    Tenant.hasMany(models.Restaurant, {
      foreignKey: 'tenant_id',
      as: 'restaurants',
    });
  };

  return Tenant;
};
