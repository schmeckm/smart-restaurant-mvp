// ============================================
// backend/src/middleware/validator.js
// ============================================
const { validationResult } = require('express-validator');
const { ApiError } = require('../utils/errors');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map(err => ({
      field: err.param,
      message: err.msg
    }));
    
    throw new ApiError(400, 'Validation failed', extractedErrors);
  }
  
  next();
};

module.exports = validate;