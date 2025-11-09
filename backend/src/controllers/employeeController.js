// backend/src/controllers/employeeController.js
// COMPLETE Employee Controller with Hard Delete

const { Employee, Restaurant } = require('../models');
const { Op } = require('sequelize');

// Debug: Check if models are loaded
console.log('🔍 Employee Controller loaded');
console.log('🔍 Employee model available:', !!Employee);

// 👥 Get all employees for restaurant
exports.getEmployees = async (req, res) => {
  try {
    console.log('🔍 getEmployees called');
    
    const restaurantId = req.user.restaurantId;
    const { page = 1, limit = 10, department, position, search } = req.query;
    
    console.log('🔍 Query params:', { page, limit, department, position, search });
    console.log('🔍 Restaurant ID:', restaurantId);
    
    // EINFACH: Nur Restaurant-Filter (kein isActive Filter)
    const where = { restaurantId };
    
    // Filter by department
    if (department && department !== 'all') {
      where.department = department;
    }
    
    // Filter by position
    if (position && position !== 'all') {
      where.position = position;
    }
    
    // Search by name or email
    if (search) {
      const searchOp = Op.iLike || Op.like;
      where[Op.or] = [
        { firstName: { [searchOp]: `%${search}%` } },
        { lastName: { [searchOp]: `%${search}%` } },
        { email: { [searchOp]: `%${search}%` } }
      ];
    }
    
    const offset = (page - 1) * limit;
    
    console.log('🔍 Final where clause:', JSON.stringify(where, null, 2));
    
    const { count, rows: employees } = await Employee.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['firstName', 'ASC'], ['lastName', 'ASC']],
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['name'],
          required: false
        }
      ]
    });
    
    console.log('✅ Found employees:', count);
    console.log('✅ Employee IDs:', employees.map(emp => emp.id));
    
    res.json({
      success: true,
      data: employees,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('❌ Get Employees Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Fehler beim Laden der Mitarbeiter: ' + error.message 
    });
  }
};

// 👤 Get single employee
exports.getEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user.restaurantId;
    
    const employee = await Employee.findOne({
      where: { id, restaurantId },
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['name'],
          required: false
        }
      ]
    });
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Mitarbeiter nicht gefunden' });
    }
    
    res.json({ success: true, data: employee });
  } catch (error) {
    console.error('❌ Get Employee Error:', error);
    res.status(500).json({ success: false, message: 'Fehler beim Laden des Mitarbeiters: ' + error.message });
  }
};

// ➕ Create new employee
exports.createEmployee = async (req, res) => {
  try {
    console.log('🔍 Creating employee with data:', req.body);
    
    const restaurantId = req.user.restaurantId;
    const employeeData = {
      ...req.body,
      restaurantId,
      hireDate: req.body.hireDate || new Date(),
      isActive: true
    };
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'position', 'department', 'hourlyWage'];
    for (const field of requiredFields) {
      if (!employeeData[field]) {
        return res.status(400).json({ 
          success: false, 
          message: `Feld '${field}' ist erforderlich` 
        });
      }
    }
    
    console.log('🔍 Final employee data:', employeeData);
    
    const employee = await Employee.create(employeeData);
    
    console.log('✅ Employee created with ID:', employee.id);
    
    // Generate employee number if method exists
    if (typeof employee.generateEmployeeNumber === 'function') {
      try {
        await employee.generateEmployeeNumber();
        await employee.save();
        console.log('✅ Employee number generated:', employee.employeeNumber);
      } catch (err) {
        console.log('⚠️ Could not generate employee number:', err.message);
      }
    }
    
    // Load employee with associations
    const newEmployee = await Employee.findByPk(employee.id, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['name'],
          required: false
        }
      ]
    });
    
    res.status(201).json({ 
      success: true, 
      data: newEmployee,
      message: 'Mitarbeiter erfolgreich erstellt' 
    });
  } catch (error) {
    console.error('❌ Create Employee Error:', error);
    
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).json({ 
        success: false, 
        message: 'Validierungsfehler',
        errors: error.errors.map(e => e.message)
      });
    }
    
    res.status(500).json({ success: false, message: 'Fehler beim Erstellen des Mitarbeiters: ' + error.message });
  }
};

// ✏️ Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user.restaurantId;
    
    const employee = await Employee.findOne({
      where: { id, restaurantId }
    });
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Mitarbeiter nicht gefunden' });
    }
    
    // Update employee data
    await employee.update(req.body);
    
    // Load updated employee with associations
    const updatedEmployee = await Employee.findByPk(employee.id, {
      include: [
        {
          model: Restaurant,
          as: 'restaurant',
          attributes: ['name'],
          required: false
        }
      ]
    });
    
    res.json({ 
      success: true, 
      data: updatedEmployee,
      message: 'Mitarbeiter erfolgreich aktualisiert' 
    });
  } catch (error) {
    console.error('❌ Update Employee Error:', error);
    res.status(500).json({ success: false, message: 'Fehler beim Aktualisieren des Mitarbeiters: ' + error.message });
  }
};

// 🗑️ Delete employee - HARD DELETE (komplett aus DB entfernen)
exports.deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user.restaurantId;
    
    console.log('🗑️ Backend: HARD DELETING employee:', id);
    
    const employee = await Employee.findOne({
      where: { id, restaurantId }
    });
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Mitarbeiter nicht gefunden' });
    }
    
    console.log('🔍 Employee before hard delete:', { 
      id: employee.id, 
      name: `${employee.firstName} ${employee.lastName}`,
      isActive: employee.isActive 
    });
    
    // HARD DELETE - komplett aus Datenbank entfernen
    await employee.destroy();
    
    console.log('✅ Employee HARD DELETED from database:', id);
    
    // Prüfen ob wirklich gelöscht
    const checkDeleted = await Employee.findOne({
      where: { id, restaurantId }
    });
    
    if (checkDeleted) {
      console.error('❌ Employee still exists after delete!');
      throw new Error('Failed to delete employee from database');
    } else {
      console.log('✅ Confirmed: Employee no longer exists in database');
    }
    
    res.json({ 
      success: true, 
      message: 'Mitarbeiter erfolgreich gelöscht' 
    });
  } catch (error) {
    console.error('❌ Hard Delete Employee Error:', error);
    res.status(500).json({ success: false, message: 'Fehler beim Löschen des Mitarbeiters: ' + error.message });
  }
};

// 📊 Get employees analytics
exports.getEmployeesAnalytics = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    
    const totalEmployees = await Employee.count({
      where: { restaurantId }
    });
    
    const employeesByDepartment = await Employee.findAll({
      where: { restaurantId },
      attributes: [
        'department',
        [Employee.sequelize.fn('COUNT', Employee.sequelize.col('id')), 'count']
      ],
      group: ['department']
    });
    
    const employeesByPosition = await Employee.findAll({
      where: { restaurantId },
      attributes: [
        'position',
        [Employee.sequelize.fn('COUNT', Employee.sequelize.col('id')), 'count']
      ],
      group: ['position']
    });
    
    res.json({
      success: true,
      data: {
        overview: {
          totalEmployees,
          avgPerformance: "5.00",
          avgReliability: "5.00", 
          totalHourlyWages: "0.00"
        },
        distribution: {
          byDepartment: employeesByDepartment.map(dept => ({
            department: dept.department,
            count: parseInt(dept.get('count'))
          })),
          byPosition: employeesByPosition.map(pos => ({
            position: pos.position,
            count: parseInt(pos.get('count'))
          }))
        }
      }
    });
  } catch (error) {
    console.error('❌ Employee Analytics Error:', error);
    res.status(500).json({ success: false, message: 'Fehler bei Mitarbeiter-Analytik: ' + error.message });
  }
};

// 🎯 Get available employees for specific shift
exports.getAvailableEmployees = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { date, startTime, endTime, position, shiftType } = req.query;
    
    if (!date || !startTime || !position) {
      return res.status(400).json({ 
        success: false, 
        message: 'Date, startTime und position sind erforderlich' 
      });
    }
    
    const employees = await Employee.findAll({
      where: { restaurantId }
    });
    
    res.json({
      success: true,
      data: employees,
      shiftInfo: { date, startTime, endTime, position, shiftType }
    });
  } catch (error) {
    console.error('❌ Available Employees Error:', error);
    res.status(500).json({ success: false, message: 'Fehler bei der Mitarbeiter-Verfügbarkeit: ' + error.message });
  }
};

// 🏆 Get top performing employees
exports.getTopPerformers = async (req, res) => {
  try {
    const restaurantId = req.user.restaurantId;
    const { limit = 5 } = req.query;
    
    const topPerformers = await Employee.findAll({
      where: { restaurantId },
      order: [['performanceScore', 'DESC']],
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      data: topPerformers
    });
  } catch (error) {
    console.error('❌ Top Performers Error:', error);
    res.status(500).json({ success: false, message: 'Fehler bei Top-Performer Abfrage: ' + error.message });
  }
};

// 📋 Update employee availability
exports.updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurantId = req.user.restaurantId;
    const { weeklyAvailability, shiftPreferences } = req.body;
    
    const employee = await Employee.findOne({
      where: { id, restaurantId }
    });
    
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Mitarbeiter nicht gefunden' });
    }
    
    const updateData = {};
    if (weeklyAvailability) updateData.weeklyAvailability = weeklyAvailability;
    if (shiftPreferences) updateData.shiftPreferences = shiftPreferences;
    
    await employee.update(updateData);
    
    res.json({ 
      success: true, 
      data: employee,
      message: 'Verfügbarkeit erfolgreich aktualisiert' 
    });
  } catch (error) {
    console.error('❌ Update Availability Error:', error);
    res.status(500).json({ success: false, message: 'Fehler beim Aktualisieren der Verfügbarkeit: ' + error.message });
  }
};