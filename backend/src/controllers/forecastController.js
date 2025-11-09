// backend/src/controllers/forecastController.js
// ✅ FINAL VERSION – inklusive Fixes für Op.ne, ForecastItems-Return, Transaktionssicherheit und Frontend-Kompatibilität

const { ForecastVersion, ForecastItem, Product, sequelize } = require('../models');
const { Op } = require('sequelize'); // ✅ Wichtig für Operatoren wie [Op.ne]

// =============================================================
// GET /api/v1/forecasts
// =============================================================
exports.getForecastVersions = async (req, res) => {
  try {
    console.log('🔍 getForecastVersions called for user:', req.user?.id);
    console.log('🏠 restaurantId from user:', req.user?.restaurantId);

    const versions = await ForecastVersion.findAll({
      where: {
        restaurantId: req.user.restaurantId
      },
      order: [['createdAt', 'DESC']]
    });

    console.log(`✅ Found ${versions.length} versions`);
    res.json({ success: true, data: versions });
  } catch (error) {
    console.error('❌ Get forecast versions error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Forecast-Versionen',
      error: error.message
    });
  }
};


// =============================================================
// GET /api/v1/forecasts/:id
// =============================================================
exports.getForecastVersion = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const versionId = req.params.id;

    console.log('🔍 Loading forecast version:', versionId);

    const version = await ForecastVersion.findOne({
      where: { id: versionId, restaurantId },
      include: [
        {
          model: ForecastItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'categoryId', 'price']
            }
          ]
        }
      ]
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Forecast-Version nicht gefunden'
      });
    }

    console.log(`✅ Found version: ${version.name}`);

    res.json({ success: true, data: version });
  } catch (error) {
    console.error('❌ Get forecast version error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Forecast-Version',
      error: error.message
    });
  }
};

// =============================================================
// POST /api/v1/forecasts
// =============================================================
exports.createForecastVersion = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      name,
      description,
      startDate,
      endDate,
      status,
      timeUnit,
      periodCount,
      isBaseline,
      items
    } = req.body;

    if (!name) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Name ist erforderlich'
      });
    }

    const restaurantId = req.user.restaurantId;
    const createdBy = req.user.id;

    const version = await ForecastVersion.create({
      name,
      description,
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      status: status || 'draft',
      timeUnit: timeUnit || 'weeks',
      periodCount: periodCount || 8,
      isBaseline: isBaseline || false,
      restaurantId,
      createdBy
    }, { transaction });

    if (items && Array.isArray(items) && items.length > 0) {
      const forecastItems = items.map(item => ({
        versionId: version.id,
        productId: item.productId,
        periodIndex: item.periodIndex,
        periodLabel: item.periodLabel,
        quantity: item.quantity || 0
      }));
      await ForecastItem.bulkCreate(forecastItems, { transaction });
    }

    await transaction.commit();

    const created = await ForecastVersion.findByPk(version.id, {
      include: [{ model: ForecastItem, as: 'items' }]
    });

    console.log(`✅ Created version: ${created.name}`);
    res.status(201).json({
      success: true,
      message: 'Forecast-Version erfolgreich erstellt',
      data: created
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Create forecast version error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen der Forecast-Version',
      error: error.message
    });
  }
};

// =============================================================
// PUT /api/v1/forecasts/:id
// =============================================================
exports.updateForecastVersion = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const restaurantId = req.user.restaurantId;
    const versionId = req.params.id;
    const { name, description, status, isBaseline, items } = req.body;

    const version = await ForecastVersion.findOne({
      where: { id: versionId, restaurantId },
      transaction
    });

    if (!version) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Forecast-Version nicht gefunden'
      });
    }

    // Handle baseline setting
    if (isBaseline === true) {
      await ForecastVersion.update(
        { isBaseline: false },
        {
          where: {
            restaurantId,
            id: { [Op.ne]: version.id }
          },
          transaction
        }
      );
    }

    // Update version meta data
    await version.update({
      name: name || version.name,
      description: description !== undefined ? description : version.description,
      status: status || version.status,
      isBaseline: isBaseline !== undefined ? isBaseline : version.isBaseline
    }, { transaction });

    // Replace forecast items if provided
    if (items && Array.isArray(items)) {
      await ForecastItem.destroy({
        where: { versionId: version.id },
        transaction
      });

      if (items.length > 0) {
        const forecastItems = items.map(item => ({
          versionId: version.id,
          productId: item.productId,
          periodIndex: item.periodIndex,
          periodLabel: item.periodLabel,
          quantity: item.quantity || 0
        }));
        await ForecastItem.bulkCreate(forecastItems, { transaction });
      }
    }

    await transaction.commit();

    const updated = await ForecastVersion.findByPk(version.id, {
      include: [{ model: ForecastItem, as: 'items' }]
    });

    console.log(`✅ Updated version: ${updated.name}`);
    res.json({
      success: true,
      message: 'Forecast-Version erfolgreich aktualisiert',
      data: updated
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Update forecast version error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren der Forecast-Version',
      error: error.message
    });
  }
};

// =============================================================
// DELETE /api/v1/forecasts/:id
// =============================================================
exports.deleteForecastVersion = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const versionId = req.params.id;

    const version = await ForecastVersion.findOne({
      where: { id: versionId, restaurantId }
    });

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Forecast-Version nicht gefunden'
      });
    }

    await version.destroy();
    console.log(`✅ Deleted version: ${version.name}`);

    res.json({
      success: true,
      message: 'Forecast-Version erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('❌ Delete forecast version error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen der Forecast-Version',
      error: error.message
    });
  }
};

// =============================================================
// POST /api/v1/forecasts/:id/clone
// =============================================================
exports.cloneForecastVersion = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const restaurantId = req.user.restaurantId;
    const sourceId = req.params.id;
    const { name } = req.body;

    const source = await ForecastVersion.findOne({
      where: { id: sourceId, restaurantId },
      include: [{ model: ForecastItem, as: 'items' }],
      transaction
    });

    if (!source) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Quell-Version nicht gefunden'
      });
    }

    const newVersion = await ForecastVersion.create({
      name: name || `${source.name} (Kopie)`,
      description: source.description,
      startDate: source.startDate,
      endDate: source.endDate,
      timeUnit: source.timeUnit,
      periodCount: source.periodCount,
      status: 'draft',
      isBaseline: false,
      restaurantId,
      createdBy: req.user.id
    }, { transaction });

    if (source.items && source.items.length > 0) {
      const clonedItems = source.items.map(item => ({
        versionId: newVersion.id,
        productId: item.productId,
        periodIndex: item.periodIndex,
        periodLabel: item.periodLabel,
        quantity: item.quantity
      }));
      await ForecastItem.bulkCreate(clonedItems, { transaction });
    }

    await transaction.commit();

    const cloned = await ForecastVersion.findByPk(newVersion.id, {
      include: [{ model: ForecastItem, as: 'items' }]
    });

    console.log(`✅ Cloned version: ${cloned.name}`);
    res.status(201).json({
      success: true,
      message: 'Forecast-Version erfolgreich dupliziert',
      data: cloned
    });
  } catch (error) {
    await transaction.rollback();
    console.error('❌ Clone forecast version error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Duplizieren der Forecast-Version',
      error: error.message
    });
  }
};
exports.uploadForecastItems = async (req, res) => {
  try {
    const versionId = req.params.id
    const { items } = req.body // [{ productId, periodIndex, periodLabel, quantity }]

    if (!versionId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Version-ID oder Items fehlen.'
      })
    }

    const version = await ForecastVersion.findByPk(versionId)
    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Forecast-Version nicht gefunden.'
      })
    }

    let created = 0
    let updated = 0

    for (const item of items) {
      if (!item.productId || item.quantity == null) continue

      const [forecastItem, createdNew] = await ForecastItem.upsert({
        versionId,
        productId: item.productId,
        periodIndex: item.periodIndex ?? 0,
        periodLabel: item.periodLabel ?? `Period ${item.periodIndex + 1}`,
        quantity: parseFloat(item.quantity) || 0
      })

      if (createdNew) created++
      else updated++
    }

    return res.status(200).json({
      success: true,
      message: `Forecast erfolgreich importiert (${created} neu, ${updated} aktualisiert).`,
      data: { created, updated }
    })
  } catch (error) {
    console.error('❌ Fehler beim Hochladen der Forecast-Items:', error)
    res.status(500).json({
      success: false,
      message: 'Fehler beim Importieren der Forecast-Daten.',
      error: error.message
    })
  }
};
