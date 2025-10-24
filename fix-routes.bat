@echo off
echo Erstelle fehlende Backend-Dateien...

cd backend\src\routes

REM products.js
(
echo const express = require^('^'^);
echo const { body, query } = require^('express-validator'^);
echo const productController = require^('../controllers/productController'^);
echo const { protect, authorize } = require^('../middleware/auth'^);
echo const validate = require^('../middleware/validator'^);
echo.
echo const router = express.Router^(^);
echo.
echo router.get^('/', protect, productController.getAllProducts^);
echo router.get^('/:id', protect, productController.getProduct^);
echo router.post^('/', protect, authorize^('admin', 'manager'^), productController.createProduct^);
echo router.put^('/:id', protect, authorize^('admin', 'manager'^), productController.updateProduct^);
echo router.delete^('/:id', protect, authorize^('admin'^), productController.deleteProduct^);
echo.
echo module.exports = router;
) > products.js

REM sales.js
(
echo const express = require^('^'^);
echo const { body, query } = require^('express-validator'^);
echo const saleController = require^('../controllers/saleController'^);
echo const { protect, authorize } = require^('../middleware/auth'^);
echo const validate = require^('../middleware/validator'^);
echo.
echo const router = express.Router^(^);
echo.
echo router.get^('/', protect, saleController.getSales^);
echo router.get^('/analytics', protect, authorize^('admin', 'manager'^), saleController.getSalesAnalytics^);
echo router.get^('/:id', protect, saleController.getSale^);
echo router.post^('/', protect, saleController.createSale^);
echo.
echo module.exports = router;
) > sales.js

REM auth.js
(
echo const express = require^('^'^);
echo const { body } = require^('express-validator'^);
echo const authController = require^('../controllers/authController'^);
echo const { protect } = require^('../middleware/auth'^);
echo const validate = require^('../middleware/validator'^);
echo.
echo const router = express.Router^(^);
echo.
echo router.post^('/register', authController.register^);
echo router.post^('/login', authController.login^);
echo router.post^('/google', authController.googleAuth^);
echo router.get^('/profile', protect, authController.getProfile^);
echo router.put^('/profile', protect, authController.updateProfile^);
echo router.post^('/logout', protect, authController.logout^);
echo.
echo module.exports = router;
) > auth.js

cd ..\..\..

echo.
echo Fertig! Dateien erstellt:
echo - backend\src\routes\products.js
echo - backend\src\routes\sales.js
echo - backend\src\routes\auth.js
echo.
echo Starte Backend neu mit: npm run dev
pause