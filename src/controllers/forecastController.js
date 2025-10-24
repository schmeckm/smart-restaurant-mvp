// backend/src/controllers/forecastController.js

const { ForecastVersion, ForecastItem, Product, User, sequelize } = require('../models');

// @desc    Get all forecast versions
// @route   GET /api/v1/forecasts
// @access  Private
exports.getForecastVersions = async (req, res) => {
  try {
    const versions = await ForecastVersion.findAll({
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: versions
    });
  } catch (error) {
    console.error('Get forecast versions error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Forecast-Versionen',
      error: error.message
    });
  }
};

// @desc    Get single forecast version with items
// @route   GET /api/v1/forecasts/:id
// @access  Private
exports.getForecastVersion = async (req, res) => {
  try {
    const version = await ForecastVersion.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: ForecastItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'category']
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

    res.json({
      success: true,
      data: version
    });
  } catch (error) {
    console.error('Get forecast version error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Forecast-Version',
      error: error.message
    });
  }
};

// @desc    Create forecast version
// @route   POST /api/v1/forecasts
// @access  Private
exports.createForecastVersion = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const {
      name,
      description,
      timeUnit,
      periodCount,
      startDate,
      status,
      isBaseline,
      items // Array of { productId, periodIndex, periodLabel, quantity }
    } = req.body;

    // Validate
    if (!name || !startDate) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Name und Startdatum sind erforderlich'
      });
    }

    // If isBaseline, unset other baselines
    if (isBaseline) {
      await ForecastVersion.update(
        { isBaseline: false },
        { where: { isBaseline: true }, transaction }
      );
    }

    // Create version
    const version = await ForecastVersion.create({
      name,
      description,
      timeUnit: timeUnit || 'weeks',
      periodCount: periodCount || 8,
      startDate: new Date(startDate),
      status: status || 'draft',
      isBaseline: isBaseline || false,
      createdBy: req.user.id
    }, { transaction });

    // Create items
    if (items && items.length > 0) {
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

    // Fetch complete version
    const createdVersion = await ForecastVersion.findByPk(version.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: ForecastItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'category']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Forecast-Version erfolgreich erstellt',
      data: createdVersion
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Create forecast version error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Erstellen der Forecast-Version',
      error: error.message
    });
  }
};

// @desc    Update forecast version
// @route   PUT /api/v1/forecasts/:id
// @access  Private
exports.updateForecastVersion = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { name, description, status, isBaseline, items } = req.body;

    const version = await ForecastVersion.findByPk(req.params.id);

    if (!version) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Forecast-Version nicht gefunden'
      });
    }

    // If isBaseline, unset other baselines
    if (isBaseline && !version.isBaseline) {
      await ForecastVersion.update(
        { isBaseline: false },
        { where: { isBaseline: true }, transaction }
      );
    }

    // Update version
    await version.update({
      name: name || version.name,
      description: description !== undefined ? description : version.description,
      status: status || version.status,
      isBaseline: isBaseline !== undefined ? isBaseline : version.isBaseline
    }, { transaction });

    // Update items if provided
    if (items && Array.isArray(items)) {
      // Delete existing items
      await ForecastItem.destroy({
        where: { versionId: version.id },
        transaction
      });

      // Create new items
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

    // Fetch updated version
    const updatedVersion = await ForecastVersion.findByPk(version.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: ForecastItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'category']
            }
          ]
        }
      ]
    });

    res.json({
      success: true,
      message: 'Forecast-Version erfolgreich aktualisiert',
      data: updatedVersion
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Update forecast version error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Aktualisieren der Forecast-Version',
      error: error.message
    });
  }
};

// @desc    Delete forecast version
// @route   DELETE /api/v1/forecasts/:id
// @access  Private
exports.deleteForecastVersion = async (req, res) => {
  try {
    const version = await ForecastVersion.findByPk(req.params.id);

    if (!version) {
      return res.status(404).json({
        success: false,
        message: 'Forecast-Version nicht gefunden'
      });
    }

    // Don't delete baseline
    if (version.isBaseline) {
      return res.status(400).json({
        success: false,
        message: 'Baseline-Version kann nicht gelöscht werden'
      });
    }

    await version.destroy();

    res.json({
      success: true,
      message: 'Forecast-Version erfolgreich gelöscht'
    });
  } catch (error) {
    console.error('Delete forecast version error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Löschen der Forecast-Version',
      error: error.message
    });
  }
};

// @desc    Clone forecast version
// @route   POST /api/v1/forecasts/:id/clone
// @access  Private
exports.cloneForecastVersion = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { name } = req.body;
    const sourceVersion = await ForecastVersion.findByPk(req.params.id, {
      include: [{ model: ForecastItem, as: 'items' }]
    });

    if (!sourceVersion) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Quell-Version nicht gefunden'
      });
    }

    // Create new version
    const newVersion = await ForecastVersion.create({
      name: name || `${sourceVersion.name} (Kopie)`,
      description: sourceVersion.description,
      timeUnit: sourceVersion.timeUnit,
      periodCount: sourceVersion.periodCount,
      startDate: sourceVersion.startDate,
      status: 'draft',
      isBaseline: false,
      createdBy: req.user.id
    }, { transaction });

    // Clone items
    if (sourceVersion.items && sourceVersion.items.length > 0) {
      const clonedItems = sourceVersion.items.map(item => ({
        versionId: newVersion.id,
        productId: item.productId,
        periodIndex: item.periodIndex,
        periodLabel: item.periodLabel,
        quantity: item.quantity
      }));

      await ForecastItem.bulkCreate(clonedItems, { transaction });
    }

    await transaction.commit();

    // Fetch complete version
    const clonedVersion = await ForecastVersion.findByPk(newVersion.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email']
        },
        {
          model: ForecastItem,
          as: 'items',
          include: [
            {
              model: Product,
              as: 'product',
              attributes: ['id', 'name', 'category']
            }
          ]
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Forecast-Version erfolgreich dupliziert',
      data: clonedVersion
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Clone forecast version error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Duplizieren der Forecast-Version',
      error: error.message
    });
  }
};