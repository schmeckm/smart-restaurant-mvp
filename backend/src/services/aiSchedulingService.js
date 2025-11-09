// backend/src/services/aiSchedulingService.js

class AISchedulingService {
  
  // 📈 Nachfrage-Vorhersage mit Machine Learning
  async predictDemand(data) {
    const { historical, weather, events, dateRange } = data;
    
    // Basis-Vorhersage aus historischen Daten
    const baselineForecast = this.calculateBaseline(historical);
    
    // Wetter-Einfluss berechnen
    const weatherImpact = this.calculateWeatherImpact(weather);
    
    // Event-Einfluss berechnen  
    const eventImpact = this.calculateEventImpact(events);
    
    // Saisonale Trends
    const seasonalTrends = this.calculateSeasonalTrends(dateRange);
    
    // 🧠 Kombinations-Algorithmus
    const forecast = baselineForecast.map((day, index) => ({
      date: day.date,
      predictedCustomers: Math.round(
        day.baseline * 
        weatherImpact[index] * 
        eventImpact[index] * 
        seasonalTrends[index]
      ),
      confidence: this.calculateConfidence(historical, index),
      factors: {
        baseline: day.baseline,
        weather: weatherImpact[index],
        events: eventImpact[index],
        seasonal: seasonalTrends[index]
      }
    }));
    
    return forecast;
  }
  
  // 🎯 Optimale Schichtplanung
  async optimizeSchedule({ employees, demand, preferences, constraints }) {
    
    // Alle möglichen Schicht-Kombinationen generieren
    const possibleSchedules = this.generateScheduleCombinations(employees, demand);
    
    // Jede Kombination bewerten
    const scoredSchedules = possibleSchedules.map(schedule => ({
      ...schedule,
      score: this.calculateScheduleScore(schedule, preferences, constraints)
    }));
    
    // Beste Option auswählen
    const bestSchedule = scoredSchedules.reduce((best, current) => 
      current.score > best.score ? current : best
    );
    
    return {
      schedule: bestSchedule,
      alternatives: scoredSchedules.slice(0, 3), // Top 3 Alternativen
      metrics: this.calculateScheduleMetrics(bestSchedule)
    };
  }
  
  // 📊 Schedule Score Berechnung
  calculateScheduleScore(schedule, preferences, constraints) {
    let score = 100;
    
    // Demand Coverage (40% Gewichtung)
    const demandCoverage = this.calculateDemandCoverage(schedule);
    score += (demandCoverage - 1) * 40;
    
    // Cost Efficiency (30% Gewichtung)  
    const costEfficiency = this.calculateCostEfficiency(schedule, constraints);
    score += (costEfficiency - 1) * 30;
    
    // Employee Satisfaction (20% Gewichtung)
    const satisfaction = this.calculateEmployeeSatisfaction(schedule, preferences);
    score += (satisfaction - 1) * 20;
    
    // Compliance (10% Gewichtung)
    const compliance = this.calculateCompliance(schedule, constraints);
    score += (compliance - 1) * 10;
    
    return Math.max(0, score);
  }
  
  // 🌤️ Wetter-Einfluss Berechnung
  calculateWeatherImpact(weatherData) {
    return weatherData.map(day => {
      let impact = 1.0;
      
      // Regen = weniger Kunden
      if (day.precipitation > 5) impact *= 0.85;
      if (day.precipitation > 15) impact *= 0.75;
      
      // Temperatur-Einfluss
      if (day.temperature < 0) impact *= 0.90; // Sehr kalt
      if (day.temperature > 30) impact *= 1.10; // Heiß = mehr Getränke
      
      // Wochenende + schönes Wetter = mehr Kunden
      if (day.isWeekend && day.temperature > 20 && day.precipitation < 2) {
        impact *= 1.25;
      }
      
      return impact;
    });
  }
}

module.exports = new AISchedulingService();