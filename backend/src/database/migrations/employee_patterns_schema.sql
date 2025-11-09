-- database/migrations/employee_patterns_schema.sql
-- Schema für Employee Availability Patterns

-- ===============================================
-- 🗃️ EMPLOYEE AVAILABILITY PATTERNS TABLE
-- ===============================================

CREATE TABLE IF NOT EXISTS employee_availability_patterns (
    id SERIAL PRIMARY KEY,
    employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    
    -- Wochentage (boolean für jeden Tag)
    monday BOOLEAN DEFAULT false,
    tuesday BOOLEAN DEFAULT false,
    wednesday BOOLEAN DEFAULT false,
    thursday BOOLEAN DEFAULT false,
    friday BOOLEAN DEFAULT false,
    saturday BOOLEAN DEFAULT false,
    sunday BOOLEAN DEFAULT false,
    
    -- Preferred working times
    preferred_start TIME,
    preferred_end TIME,
    
    -- Additional info
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT valid_time_range_pattern CHECK (
        (preferred_start IS NULL AND preferred_end IS NULL) OR 
        (preferred_start IS NOT NULL AND preferred_end IS NOT NULL AND preferred_start < preferred_end)
    ),
    
    -- One pattern per employee per restaurant
    UNIQUE(employee_id, restaurant_id)
);

-- ===============================================
-- 📈 INDEXES for Performance
-- ===============================================

CREATE INDEX IF NOT EXISTS idx_employee_patterns_employee 
    ON employee_availability_patterns(employee_id);
    
CREATE INDEX IF NOT EXISTS idx_employee_patterns_restaurant 
    ON employee_availability_patterns(restaurant_id);
    
CREATE INDEX IF NOT EXISTS idx_employee_patterns_active 
    ON employee_availability_patterns(is_active);

-- Composite index für häufige Abfragen
CREATE INDEX IF NOT EXISTS idx_employee_patterns_employee_restaurant 
    ON employee_availability_patterns(employee_id, restaurant_id);

-- ===============================================
-- 🔄 TRIGGERS
-- ===============================================

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_employee_patterns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_employee_patterns_updated_at 
    ON employee_availability_patterns;
CREATE TRIGGER trigger_update_employee_patterns_updated_at
    BEFORE UPDATE ON employee_availability_patterns
    FOR EACH ROW EXECUTE FUNCTION update_employee_patterns_updated_at();

-- ===============================================
-- 🔧 UPDATE EXISTING AVAILABILITY TABLE
-- ===============================================

-- Add restaurant_id to employee_availability if not exists
ALTER TABLE employee_availability 
ADD COLUMN IF NOT EXISTS restaurant_id UUID REFERENCES restaurants(id) ON DELETE CASCADE;

-- Create restaurant_id index if not exists
CREATE INDEX IF NOT EXISTS idx_employee_availability_restaurant_id 
    ON employee_availability(restaurant_id);

-- Update constraint to include restaurant_id
DO $$ 
BEGIN
    -- Drop old constraint
    ALTER TABLE employee_availability 
    DROP CONSTRAINT IF EXISTS employee_availability_employee_id_date_start_time_end_time_key;
    
    -- Add new constraint with restaurant_id
    ALTER TABLE employee_availability 
    ADD CONSTRAINT employee_availability_unique_entry 
    UNIQUE(employee_id, restaurant_id, date, start_time, end_time);
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Constraint update skipped: %', SQLERRM;
END $$;

-- ===============================================
-- 📊 HELPFUL VIEWS
-- ===============================================

-- View: Employee mit ihren Patterns
CREATE OR REPLACE VIEW employee_patterns_overview AS
SELECT 
    e.id as employee_id,
    e.first_name,
    e.last_name,
    e.position,
    e.restaurant_id,
    r.name as restaurant_name,
    eap.monday,
    eap.tuesday,
    eap.wednesday,
    eap.thursday,
    eap.friday,
    eap.saturday,
    eap.sunday,
    eap.preferred_start,
    eap.preferred_end,
    eap.notes as pattern_notes,
    eap.is_active as pattern_active,
    eap.created_at as pattern_created,
    eap.updated_at as pattern_updated
FROM employees e
LEFT JOIN employee_availability_patterns eap ON e.id = eap.employee_id 
    AND e.restaurant_id = eap.restaurant_id
LEFT JOIN restaurants r ON e.restaurant_id = r.id
WHERE e.is_active = true;

-- ===============================================
-- 🧪 SAMPLE DATA (Optional)
-- ===============================================

-- Insert sample patterns (nur wenn employees existieren)
DO $$
DECLARE 
    sample_employee_id UUID;
    sample_restaurant_id UUID;
BEGIN
    -- Get first employee for sample
    SELECT e.id, e.restaurant_id INTO sample_employee_id, sample_restaurant_id
    FROM employees e 
    LIMIT 1;
    
    IF sample_employee_id IS NOT NULL THEN
        INSERT INTO employee_availability_patterns 
        (employee_id, restaurant_id, monday, tuesday, wednesday, thursday, friday, preferred_start, preferred_end, notes)
        VALUES 
        (sample_employee_id, sample_restaurant_id, true, true, true, true, true, '09:00', '17:00', 'Standard work week pattern')
        ON CONFLICT (employee_id, restaurant_id) DO NOTHING;
        
        RAISE NOTICE 'Sample pattern created for employee %', sample_employee_id;
    ELSE
        RAISE NOTICE 'No employees found for sample data';
    END IF;
END $$;

-- ===============================================
-- ✅ VERIFY SCHEMA
-- ===============================================

-- Check if everything was created correctly
SELECT 
    'employee_availability_patterns' as table_name,
    COUNT(*) as record_count
FROM employee_availability_patterns
UNION ALL
SELECT 
    'Views created',
    COUNT(*) 
FROM information_schema.views 
WHERE table_name = 'employee_patterns_overview';

-- Show pattern statistics
SELECT 
    r.name as restaurant,
    COUNT(eap.*) as patterns_count,
    COUNT(CASE WHEN eap.is_active = true THEN 1 END) as active_patterns
FROM restaurants r
LEFT JOIN employee_availability_patterns eap ON r.id = eap.restaurant_id
GROUP BY r.id, r.name;