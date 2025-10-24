// backend/src/routes/forecasts.js

const express = require('express');
const router = express.Router();
const {
  getForecastVersions,
  getForecastVersion,
  createForecastVersion,
  updateForecastVersion,
  deleteForecastVersion,
  cloneForecastVersion
} = require('../controllers/forecastController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.use(protect);

router.route('/')
  .get(getForecastVersions)
  .post(createForecastVersion);

router.route('/:id')
  .get(getForecastVersion)
  .put(updateForecastVersion)
  .delete(deleteForecastVersion);

router.post('/:id/clone', cloneForecastVersion);

module.exports = router;