// ✅ Vollständiges Restaurant Model mit Multi-Tenant Support & GPS Integration

const { DataTypes } = require('sequelize');

/**
 * @swagger
 * components:
 *   schemas:
 *     Restaurant:
 *       type: object
 *       description: Restaurant / Mandant in der Beiz'le Wirt SaaS Lösung mit GPS-Integration
 *       required:
 *         - name
 *         - tenantId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: "c4a9a456-bef4-4a22-a513-9229f8a7e0dd"
 *         tenantId:
 *           type: string
 *           format: uuid
 *           description: Eindeutiger Mandanten-Identifier
 *         name:
 *           type: string
 *           example: "Beizli zum Löwen"
 *         type:
 *           type: string
 *           enum: [Beizli, Pizzeria, Grieche, Imbiss, FineDining, Bergwirtschaft]
 *           example: "Beizli"
 *         address:
 *           type: string
 *           example: "Hauptstrasse 12, 4000 Basel"
 *         postalCode:
 *           type: string
 *           example: "4000"
 *           description: "NEW: Schweizer Postleitzahl für GPS-Lookup"
 *         latitude:
 *           type: number
 *           format: decimal
 *           example: 47.5596
 *           description: "NEW: GPS Breitengrad (Schweizer Grenzen: 45.8-47.9)"
 *         longitude:
 *           type: number
 *           format: decimal
 *           example: 7.5886
 *           description: "NEW: GPS Längengrad (Schweizer Grenzen: 5.9-10.6)"
 *         city:
 *           type: string
 *           example: "Basel"
 *           description: "NEW: Stadt für Event-Analyse"
 *         email:
 *           type: string
 *           example: "info@beizli-loewen.ch"
 *         phone:
 *           type: string
 *           example: "+41 61 123 45 67"
 *         subscriptionPlan:
 *           type: string
 *           enum: [Free, Fux, Pro, Enterprise, SuccessBased]
 *           example: "Pro"
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
  const Restaurant = sequelize.define(
    'Restaurant',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      tenantId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: 'tenant_id',
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      type: {
        type: DataTypes.ENUM('Beizli', 'Pizzeria', 'Grieche', 'Imbiss', 'FineDining', 'Bergwirtschaft'),
        defaultValue: 'Beizli',
      },
      address: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      
      // 🗺️ NEW GPS & LOCATION FIELDS (integrated into existing structure)
      city: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'Stadt für Event-Analyse und GPS-Fallback'
      },
      postalCode: {
        type: DataTypes.STRING(10),
        allowNull: true,
        field: 'postal_code',
        comment: 'Schweizer Postleitzahl (4 Stellen) für Geocoding',
        validate: {
          isSwissPostalCode(value) {
            if (value && !/^\d{4}$/.test(value)) {
              throw new Error('Schweizer PLZ muss exakt 4 Stellen haben');
            }
          }
        }
      },
      latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
        comment: 'GPS Breitengrad (Schweizer Grenzen: 45.8-47.9)',
        validate: {
          min: {
            args: [45.8],
            msg: 'Latitude muss in Schweizer Grenzen sein (45.8-47.9)'
          },
          max: {
            args: [47.9], 
            msg: 'Latitude muss in Schweizer Grenzen sein (45.8-47.9)'
          }
        }
      },
      longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
        comment: 'GPS Längengrad (Schweizer Grenzen: 5.9-10.6)',
        validate: {
          min: {
            args: [5.9],
            msg: 'Longitude muss in Schweizer Grenzen sein (5.9-10.6)'
          },
          max: {
            args: [10.6],
            msg: 'Longitude muss in Schweizer Grenzen sein (5.9-10.6)'
          }
        }
      },
      
      // EXISTING FIELDS (unchanged)
      email: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: { isEmail: true },
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      subscriptionPlan: {
        type: DataTypes.ENUM('Free', 'Fux', 'Pro', 'Enterprise', 'SuccessBased'),
        defaultValue: 'Free',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: 'restaurants',
      timestamps: true,
      underscored: true,
      indexes: [
        // EXISTING INDEXES (unchanged)
        { fields: ['tenant_id'], name: 'idx_restaurant_tenant' },
        { fields: ['name'], name: 'idx_restaurant_name' },
        { fields: ['subscription_plan'], name: 'idx_restaurant_plan' },
        
        // 🗺️ NEW GPS INDEXES
        { 
          fields: ['latitude', 'longitude'], 
          name: 'idx_restaurant_gps',
          where: {
            latitude: { [sequelize.Sequelize.Op.not]: null },
            longitude: { [sequelize.Sequelize.Op.not]: null }
          }
        },
        { fields: ['city'], name: 'idx_restaurant_city' },
        { fields: ['postal_code'], name: 'idx_restaurant_postal' }
      ],
      
      // 🗺️ MODEL VALIDATIONS
      validate: {
        // GPS coordinates must both be present or both absent
        gpsConsistency() {
          const hasLat = this.latitude !== null && this.latitude !== undefined;
          const hasLng = this.longitude !== null && this.longitude !== undefined;
          
          if (hasLat !== hasLng) {
            throw new Error('GPS Koordinaten müssen beide angegeben oder beide leer sein');
          }
        }
      },

      // 🗺️ MODEL HOOKS
      hooks: {
        // Before save: GPS validation
        beforeSave: async (restaurant, options) => {
          if (restaurant.latitude && restaurant.longitude) {
            const lat = parseFloat(restaurant.latitude);
            const lng = parseFloat(restaurant.longitude);
            
            console.log(`📍 GPS validiert für ${restaurant.name}: ${lat}, ${lng}`);
          }
        },

        // After create: log GPS status
        afterCreate: async (restaurant, options) => {
          const hasGPS = restaurant.latitude && restaurant.longitude;
          console.log(`🏪 Restaurant erstellt: ${restaurant.name} (${restaurant.type}) - GPS: ${hasGPS ? '✅' : '❌'}`);
        }
      }
    }
  );

  // ===============================
  // 🔗 Associations (unchanged)
  // ===============================
  Restaurant.associate = (models) => {
    if (models.Sale) {
      Restaurant.hasMany(models.Sale, {
        foreignKey: 'restaurantId',
        as: 'sales',
        onDelete: 'CASCADE',
      });
    }
    if (models.User) {
      Restaurant.hasMany(models.User, {
        foreignKey: 'restaurantId',
        as: 'users',
        onDelete: 'SET NULL',
      });
    }
    if (models.Product) {
      Restaurant.hasMany(models.Product, {
        foreignKey: 'restaurantId',
        as: 'products',
        onDelete: 'CASCADE',
      });
    }
  };

  // ===============================
  // 🔹 Class Methods (existing + GPS)
  // ===============================
  Restaurant.getActiveRestaurants = async function (tenantId = null) {
    const where = { isActive: true };
    if (tenantId) where.tenantId = tenantId;
    return await Restaurant.findAll({ where, order: [['name', 'ASC']] });
  };

  Restaurant.getRestaurantRevenue = async function (restaurantId, startDate, endDate) {
    if (!sequelize.models.Sale) return 0;
    return await sequelize.models.Sale.getTotalRevenue(startDate, endDate, restaurantId);
  };

  // 🗺️ NEW GPS CLASS METHODS
  Restaurant.findByLocation = async function(lat, lng, radiusKm = 5, tenantId = null) {
    const where = {
      latitude: { [sequelize.Sequelize.Op.not]: null },
      longitude: { [sequelize.Sequelize.Op.not]: null },
      isActive: true
    };
    
    if (tenantId) where.tenantId = tenantId;
    
    const restaurants = await this.findAll({ where });

    // Filter by radius using Haversine formula
    return restaurants.filter(restaurant => {
      const R = 6371; // Earth's radius in km
      const dLat = (lat - restaurant.latitude) * Math.PI / 180;
      const dLng = (lng - restaurant.longitude) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(restaurant.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
        Math.sin(dLng/2) * Math.sin(dLng/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;
      
      return distance <= radiusKm;
    });
  };

  Restaurant.getGPSStatistics = async function(tenantId = null) {
    const where = {};
    if (tenantId) where.tenantId = tenantId;

    const [total, withGPS, withAddress] = await Promise.all([
      this.count({ where }),
      this.count({
        where: {
          ...where,
          [sequelize.Sequelize.Op.and]: [
            { latitude: { [sequelize.Sequelize.Op.not]: null } },
            { longitude: { [sequelize.Sequelize.Op.not]: null } }
          ]
        }
      }),
      this.count({
        where: {
          ...where,
          address: { [sequelize.Sequelize.Op.not]: null }
        }
      })
    ]);

    return {
      total,
      withGPS,
      withoutGPS: total - withGPS,
      withAddress,
      completionRate: total > 0 ? Math.round((withGPS / total) * 100) : 0
    };
  };

  Restaurant.getRestaurantsBySubscription = async function(plan, tenantId = null) {
    const where = { subscriptionPlan: plan };
    if (tenantId) where.tenantId = tenantId;
    
    return await this.findAll({ 
      where, 
      order: [['name', 'ASC']],
      include: ['sales'] // Include sales for revenue analysis
    });
  };

  // ===============================
  // 🗺️ INSTANCE METHODS (NEW)
  // ===============================
  Restaurant.prototype.hasGPS = function() {
    return this.latitude !== null && this.longitude !== null;
  };

  Restaurant.prototype.getLocation = function() {
    return {
      coordinates: this.hasGPS() ? {
        lat: parseFloat(this.latitude),
        lng: parseFloat(this.longitude)
      } : null,
      address: this.address,
      city: this.city,
      postalCode: this.postalCode,
      country: 'CH' // Swiss restaurants
    };
  };

  Restaurant.prototype.getLocationQuality = function() {
    if (this.hasGPS() && this.address) return 'high';
    if (this.hasGPS()) return 'medium';
    if (this.postalCode && this.city) return 'low';
    return 'none';
  };

  Restaurant.prototype.distanceTo = function(lat, lng) {
    if (!this.hasGPS()) return null;
    
    const R = 6371; // Earth's radius in km
    const dLat = (lat - this.latitude) * Math.PI / 180;
    const dLng = (lng - this.longitude) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.latitude * Math.PI / 180) * Math.cos(lat * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c; // Distance in km
  };

  Restaurant.prototype.isInRadius = function(centerLat, centerLng, radiusKm) {
    const distance = this.distanceTo(centerLat, centerLng);
    return distance !== null && distance <= radiusKm;
  };

  Restaurant.prototype.getSubscriptionFeatures = function() {
    const features = {
      Free: {
        gpsAnalytics: false,
        eventAnalysis: false,
        aiForecasting: false,
        maxProducts: 10
      },
      Fux: {
        gpsAnalytics: true,
        eventAnalysis: false, 
        aiForecasting: false,
        maxProducts: 50
      },
      Pro: {
        gpsAnalytics: true,
        eventAnalysis: true,
        aiForecasting: true,
        maxProducts: 200
      },
      Enterprise: {
        gpsAnalytics: true,
        eventAnalysis: true,
        aiForecasting: true,
        maxProducts: -1 // unlimited
      },
      SuccessBased: {
        gpsAnalytics: true,
        eventAnalysis: true,
        aiForecasting: true,
        maxProducts: -1 // unlimited
      }
    };

    return features[this.subscriptionPlan] || features.Free;
  };

  Restaurant.prototype.canUseGPSFeatures = function() {
    const features = this.getSubscriptionFeatures();
    return features.gpsAnalytics && this.hasGPS();
  };

  // ===============================
  // 🔹 Hooks (existing + GPS logging)
  // ===============================
  Restaurant.beforeDestroy(async (restaurant) => {
    console.log(`🔔 Restaurant ${restaurant.name} (ID: ${restaurant.id}) wird gelöscht`);
    console.log(`📊 Subscription: ${restaurant.subscriptionPlan}, GPS: ${restaurant.hasGPS() ? 'Ja' : 'Nein'}`);
  });

  return Restaurant;
};