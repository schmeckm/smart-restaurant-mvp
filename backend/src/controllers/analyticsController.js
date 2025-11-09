// backend/src/controllers/analyticsController.js (SOFORT-FIX)
const { Op, fn, col, literal } = require('sequelize');
const dayjs = require('dayjs');

// 🔧 WICHTIG: DayJS Plugins laden
const isSameOrBefore = require('dayjs/plugin/isSameOrBefore');
const isSameOrAfter = require('dayjs/plugin/isSameOrAfter');
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

const { Sale, Product, Ingredient,ProductIngredient} = require('../models');


// ============================================================
// 📊 Heutige Statistiken (funktioniert bereits)
// ============================================================
// DEFINITIVE LÖSUNG: getTodayAnalytics Umsatz-Berechnung repariert
// Ersetzen Sie diese Funktion in analyticsController.js

exports.getTodayAnalytics = async (req, res) => {
  try {
    const restaurantId = req.user ? req.user.restaurantId : 1;

    const startOfDay = dayjs().startOf('day').toDate();
    const endOfDay = dayjs().endOf('day').toDate();

    // Verkäufe von heute abrufen
    const sales = await Sale.findAll({
      where: {
        restaurantId,
        sale_date: { [Op.between]: [startOfDay, endOfDay] },
      },
      include: [{ model: Product, as: 'product', attributes: ['id', 'name', 'price'] }],
      // 🔧 WICHTIG: Raw-Daten abrufen für Debugging
      raw: false
    });

    console.log('🔍 DEBUG - Raw Sales Data:', JSON.stringify(sales, null, 2));

    const totalSales = sales.length;
    
    // 🔧 BEHOBEN: Mehrere Feldnamen-Varianten prüfen
    const totalRevenue = sales.reduce((sum, sale) => {
      // Verschiedene mögliche Feldnamen testen
      const revenue = parseFloat(
        sale.total_price ||           // snake_case
        sale.totalPrice ||            // camelCase  
        sale.get?.('total_price') ||  // Sequelize getter
        sale.get?.('totalPrice') ||   // Sequelize getter camelCase
        sale.dataValues?.total_price || // DataValues
        sale.dataValues?.totalPrice ||  // DataValues camelCase
        sale.price ||                 // Fallback
        0
      );
      
      console.log(`🔍 Sale ID: ${sale.id}, Revenue: ${revenue}, Raw:`, {
        total_price: sale.total_price,
        totalPrice: sale.totalPrice,
        dataValues: sale.dataValues
      });
      
      return sum + revenue;
    }, 0);

    const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;

    // Aktive Produkte zählen
    const activeProducts = await Product.count({
      where: { restaurantId, isActive: true },
    });

    // Lagerwert
    const ingredients = await Ingredient.findAll({ 
      where: { restaurantId, isActive: true },
      attributes: ['pricePerUnit', 'stockQuantity']
    });
    
    const totalStockValue = ingredients.reduce(
      (sum, ing) =>
        sum + parseFloat(ing.pricePerUnit || 0) * parseFloat(ing.stockQuantity || 0),
      0
    );

    console.log('🔍 FINAL CALCULATION:', {
      totalSales,
      totalRevenue,
      avgOrderValue,
      activeProducts,
      totalStockValue
    });

    res.json({
      success: true,
      data: {
        totalSales,
        totalRevenue: parseFloat(totalRevenue.toFixed(2)),
        avgOrderValue: parseFloat(avgOrderValue.toFixed(2)),
        activeProducts,
        totalStockValue: parseFloat(totalStockValue.toFixed(2)),
      },
    });
  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Dashboard-Statistiken',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================================
// 📈 Tagesumsätze (BEHOBEN: DayJS + fillMissingDates)
// ============================================================
exports.getDailySales = async (req, res) => {
  try {
    const restaurantId = req.user ? req.user.restaurantId : 1;
    const { startDate, endDate } = req.query;

    // Input validation
    if (startDate && !dayjs(startDate).isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid startDate format. Use YYYY-MM-DD'
      });
    }

    if (endDate && !dayjs(endDate).isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Invalid endDate format. Use YYYY-MM-DD'
      });
    }

    const start = startDate
      ? dayjs(startDate).startOf('day').toDate()
      : dayjs().subtract(7, 'day').toDate();
    const end = endDate ? dayjs(endDate).endOf('day').toDate() : dayjs().toDate();

    const sales = await Sale.findAll({
      where: {
        restaurantId,
        sale_date: { [Op.between]: [start, end] },
      },
      attributes: [
        [fn('DATE', col('sale_date')), 'date'],
        [fn('SUM', col('total_price')), 'revenue'],
        [fn('COUNT', col('id')), 'sales'],
      ],
      group: [fn('DATE', col('sale_date'))],
      order: [[literal('date'), 'ASC']],
    });

    // 🔧 BEHOBEN: Korrigierte fillMissingDates Funktion
    const formatted = sales.map((s) => ({
      date: s.get('date'),
      dailyRevenue: parseFloat(s.get('revenue') || 0),
      totalSales: parseInt(s.get('sales') || 0, 10),
    }));

    // Fehlende Tage mit 0-Werten füllen
    const filledData = fillMissingDates(formatted, start, end);

    res.json({ 
      success: true, 
      data: filledData,
      meta: {
        startDate: dayjs(start).format('YYYY-MM-DD'),
        endDate: dayjs(end).format('YYYY-MM-DD'),
        totalDays: filledData.length
      }
    });
  } catch (error) {
    console.error('❌ Daily Sales Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Fehler beim Laden der Umsatzdaten',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// 🔧 BEHOBEN: fillMissingDates Funktion mit korrektem dayjs
function fillMissingDates(data, startDate, endDate) {
  const result = [];
  let current = dayjs(startDate);
  const end = dayjs(endDate);

  while (current.isSameOrBefore(end, 'day')) {
    const dateStr = current.format('YYYY-MM-DD');
    const existingData = data.find(d => d.date === dateStr);
    
    result.push({
      date: dateStr,
      dailyRevenue: existingData ? existingData.dailyRevenue : 0,
      totalSales: existingData ? existingData.totalSales : 0
    });
    
    current = current.add(1, 'day');
  }

  return result;
}

// ============================================================
// 🏆 Top 5 Produkte nach Umsatz (vereinfacht)
// ============================================================
exports.getTopProducts = async (req, res) => {
  try {
    const { Sale, Product, sequelize } = require('../models');
    const restaurantId = req.user ? req.user.restaurantId : 1;
    const { limit = 5 } = req.query;

    const topProducts = await Sale.findAll({
      where: { restaurantId },
      include: [
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'price'],
        },
      ],
      attributes: [
        'product_id',
        [sequelize.fn('SUM', sequelize.col('quantity')), 'totalQuantity'],
        [sequelize.fn('SUM', sequelize.col('total_price')), 'totalRevenue'],
      ],
      group: ['Sale.product_id', 'product.id', 'product.name', 'product.price'],
      order: [[sequelize.literal('"totalRevenue"'), 'DESC']],
      limit: parseInt(limit),
    });

    const formatted = topProducts.map((p, index) => ({
      rank: index + 1,
      id: p.product?.id,
      name: p.product?.name || 'Unbekannt',
      price: parseFloat(p.product?.price || 0),
      sales: parseInt(p.get('totalQuantity') || 0, 10),
      revenue: parseFloat(p.get('totalRevenue') || 0),
    }));

    return res.json({ 
      success: true, 
      data: formatted,
      meta: {
        limit: parseInt(limit),
        totalProducts: formatted.length
      }
    });
  } catch (error) {
    console.error('❌ Top Products Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Fehler beim Laden der Top-Produkte',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ============================================================
// 🧂 Zutaten mit niedrigstem Bestand (BEHOBEN: Schema-kompatibel)
// ============================================================
// FINALE KORREKTUR: getLowStockIngredients Funktion
// Ersetzen Sie nur diese Funktion in Ihrem analyticsController.js

exports.getLowStockIngredients = async (req, res) => {
  try {
    const restaurantId = req.user ? req.user.restaurantId : 1;
    const { limit = 10, includeAll = false } = req.query;

    const whereClause = { 
      restaurantId, 
      isActive: true 
    };

    // 🔧 BEHOBEN: Verwende echte Spaltennamen in WHERE-Klause, nicht Aliases
    if (!includeAll) {
      whereClause[Op.or] = [
        { stock_quantity: { [Op.lte]: col('min_stock_level') } }, // ← Echte Spaltennamen
        { stock_quantity: { [Op.lte]: 0 } }
      ];
    }

    const ingredients = await Ingredient.findAll({
      where: whereClause,
      attributes: [
        'id',
        'name',
        'unit',
        ['stock_quantity', 'stockQuantity'],    // ← Alias korrekt definiert
        ['min_stock_level', 'minStockLevel'],   // ← Alias korrekt definiert  
        ['price_per_unit', 'pricePerUnit'],     // ← Alias korrekt definiert
        'supplier'
      ],
      order: [['stock_quantity', 'ASC']], // ← Echter Spaltenname für ORDER BY
      limit: parseInt(limit),
    });

    const formatted = ingredients.map((ing) => {
      const stockQty = parseFloat(ing.stockQuantity || 0);
      const minLevel = parseFloat(ing.minStockLevel || 0);
      const price = parseFloat(ing.pricePerUnit || 0);
      
      return {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        stockQuantity: stockQty,
        minStockLevel: minLevel,
        pricePerUnit: price,
        supplier: ing.supplier,
        stockValue: parseFloat((stockQty * price).toFixed(2)),
        isLow: stockQty <= minLevel,
        isCritical: stockQty <= 0,
        stockLevel: stockQty <= 0 ? 'critical' : 
                   stockQty <= minLevel ? 'low' : 'normal'
      };
    });

    // Statistiken
    const critical = formatted.filter(i => i.isCritical);
    const low = formatted.filter(i => i.isLow && !i.isCritical);

    res.json({ 
      success: true, 
      data: formatted,
      meta: {
        total: formatted.length,
        critical: critical.length,
        low: low.length,
        totalValue: formatted.reduce((sum, i) => sum + i.stockValue, 0).toFixed(2)
      }
    });
  } catch (error) {
    console.error('❌ Low Stock Ingredients Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Fehler beim Laden der Lagerbestände',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
},
// backend/src/controllers/analyticsController.js

// 💰 Gewinnmarge pro Produkt
// 💰 Korrekte Gewinnmarge mit 'ingredients' alias
exports.getProductProfitability = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { startDate, endDate, period = '30d' } = req.query;

    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const start = startDate ? new Date(startDate) : dayjs().subtract(days, 'day').toDate();
    const end = endDate ? new Date(endDate) : dayjs().toDate();

    // ✅ KORREKT: 'ingredients' verwenden (nicht 'productIngredients')
    const products = await Product.findAll({
      where: { restaurantId },
      include: [
        {
          model: Sale,
          as: 'sales',
          where: {
            sale_date: { [Op.between]: [start, end] }
          },
          required: false,
          attributes: ['quantity', 'total_price', 'sale_date']
        },
        {
          model: Ingredient,
          as: 'ingredients', // ✅ Product -> ingredients (via ProductIngredient)
          through: {
            model: ProductIngredient,
            attributes: ['quantity', 'unit'] // Through-Tabelle Attribute
          },
          attributes: ['name', 'pricePerUnit', 'unit']
        }
      ],
      attributes: ['id', 'name', 'price', 'description']
    });

    console.log('🔍 Found products:', products.length);

    const profitability = products
      .filter(product => product.sales && product.sales.length > 0)
      .map(product => {
        const salePrice = parseFloat(product.price || 0);
        
        // 🔥 ECHTE Materialkosten mit korrektem Alias
        let materialCost = 0;
        if (product.ingredients && product.ingredients.length > 0) {
          materialCost = product.ingredients.reduce((cost, ingredient) => {
            // ✅ Zugriff auf Through-Tabelle Daten über ingredient.ProductIngredient
            const quantity = parseFloat(ingredient.ProductIngredient?.quantity || 0);
            const pricePerUnit = parseFloat(ingredient.pricePerUnit || 0);
            return cost + (quantity * pricePerUnit);
          }, 0);
        } else {
          // Fallback: Geschätzte Kosten
          materialCost = salePrice * 0.35;
        }

        const totalSales = product.sales.reduce((sum, sale) => sum + parseInt(sale.quantity || 0), 0);
        const totalRevenue = product.sales.reduce((sum, sale) => sum + parseFloat(sale.total_price || 0), 0);
        
        const grossProfit = salePrice - materialCost;
        const grossMargin = salePrice > 0 ? (grossProfit / salePrice) * 100 : 0;
        const totalProfit = totalSales * grossProfit;

        return {
          id: product.id,
          name: product.name,
          salePrice,
          materialCost: parseFloat(materialCost.toFixed(2)),
          grossProfit: parseFloat(grossProfit.toFixed(2)),
          grossMargin: parseFloat(grossMargin.toFixed(2)),
          totalSales,
          totalRevenue: parseFloat(totalRevenue.toFixed(2)),
          totalProfit: parseFloat(totalProfit.toFixed(2)),
          profitPerSale: parseFloat(grossProfit.toFixed(2)),
          hasRealCosts: product.ingredients && product.ingredients.length > 0,
          ingredientCount: product.ingredients?.length || 0
        };
      })
      .sort((a, b) => b.grossMargin - a.grossMargin);

    res.json({ 
      success: true, 
      data: profitability,
      period: `${days} Tage`
    });

  } catch (error) {
    console.error('❌ Product Profitability Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Fehler bei Gewinnanalyse',
      error: error.message 
    });
  }
};

// 💰 Gesamt-Finanzübersicht
exports.getFinancialOverview = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { period = '30d' } = req.query;
    
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
    const startDate = dayjs().subtract(days, 'day').toDate();
    const endDate = dayjs().toDate();

    // Gesamtumsatz
    const totalRevenue = await Sale.sum('total_price', {
      where: { restaurantId, sale_date: { [Op.between]: [startDate, endDate] } }
    });

    // Materialkosten (vereinfacht)
    const ingredients = await Ingredient.findAll({ where: { restaurantId } });
    const totalMaterialCosts = ingredients.reduce((sum, ing) => {
      const usedQuantity = parseFloat(ing.maxStock || 100) - parseFloat(ing.stockQuantity || 0);
      return sum + (usedQuantity * parseFloat(ing.pricePerUnit || 0));
    }, 0);

    // Fixkosten (könnten aus separater Tabelle kommen)
    const estimatedFixedCosts = 2000; // Miete, Personal, etc. (sollte konfigurierbar sein)
    
    const grossProfit = totalRevenue - totalMaterialCosts;
    const netProfit = grossProfit - estimatedFixedCosts;
    const grossMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const netMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // Break-even Analyse
    const avgOrderValue = await Sale.findOne({
      where: { restaurantId, sale_date: { [Op.between]: [startDate, endDate] } },
      attributes: [[fn('AVG', col('total_price')), 'avg']]
    });
    
    const avgOrder = parseFloat(avgOrderValue?.get('avg') || 0);
    const breakEvenOrders = avgOrder > 0 ? Math.ceil(estimatedFixedCosts / (avgOrder * (grossMargin / 100))) : 0;

    res.json({
      success: true,
      data: {
        period: `${days} Tage`,
        revenue: {
          total: parseFloat(totalRevenue || 0),
          daily: parseFloat((totalRevenue || 0) / days),
        },
        costs: {
          materials: parseFloat(totalMaterialCosts.toFixed(2)),
          fixed: estimatedFixedCosts,
          total: parseFloat((totalMaterialCosts + estimatedFixedCosts).toFixed(2))
        },
        profit: {
          gross: parseFloat(grossProfit.toFixed(2)),
          net: parseFloat(netProfit.toFixed(2)),
          grossMargin: parseFloat(grossMargin.toFixed(2)),
          netMargin: parseFloat(netMargin.toFixed(2))
        },
        breakEven: {
          ordersNeeded: breakEvenOrders,
          avgOrderValue: parseFloat(avgOrder.toFixed(2))
        }
      }
    });
  } catch (error) {
    console.error('❌ Financial Overview Error:', error);
    res.status(500).json({ success: false, message: 'Fehler bei Finanzübersicht' });
  }
};