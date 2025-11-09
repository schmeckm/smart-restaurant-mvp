// ============================================================
// 🤖 KI-Nachfragevorhersage & Schichtplan-Optimierung
// ============================================================

const axios = require('axios');
const dayjs = require('dayjs');
const Holidays = require('date-holidays');
const realEventService = require('../services/realEventService');
const { Op } = require('sequelize');
const { Restaurant, Sale } = require('../models');

// ============================================================
// 🧠 KI-Modelle (Claude + GPT optional)
// ============================================================
const useClaude = !!process.env.ANTHROPIC_API_KEY?.startsWith('sk-ant-');
let anthropic = null;
let openai = null;

if (useClaude) {
  const Anthropic = require('@anthropic-ai/sdk');
  anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  console.log('🤖 Using Claude AI for Forecast + Schedule Optimization');
} else if (process.env.OPENAI_API_KEY) {
  const OpenAI = require('openai');
  openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  console.log('🧠 Using OpenAI GPT for Forecast + Schedule Optimization');
} else {
  console.log('⚠️ No AI key found – fallback mode active');
}

// ============================================================
// 🌦️ Wetterdaten abrufen
// ============================================================
const getWeatherForecast = async (restaurant) => {
  try {
    const { latitude, longitude, city, postalCode } = restaurant;
    const apiKey = process.env.OPENWEATHER_KEY;
    const baseUrl = process.env.OPENWEATHER_URL;

    if (!apiKey || !baseUrl) throw new Error('Missing weather API configuration');

    let locationQuery = '';
    if (latitude && longitude) locationQuery = `lat=${latitude}&lon=${longitude}`;
    else if (postalCode) locationQuery = `zip=${postalCode},CH`;
    else if (city) locationQuery = `q=${encodeURIComponent(city)},CH`;
    else throw new Error('No location found for weather data');

    const url = `${baseUrl}?${locationQuery}&units=metric&appid=${apiKey}`;
    const { data } = await axios.get(url);

    const tempAvg = (
      data.list.reduce((sum, w) => sum + w.main.temp, 0) / data.list.length
    ).toFixed(1);

    return {
      tempAvg: parseFloat(tempAvg),
      description: data.list[0].weather[0].description,
      humidity: data.list[0].main.humidity,
      wind: data.list[0].wind?.speed || 0,
    };
  } catch (err) {
    console.warn('⚠️ Weather fallback:', err.message);
    return { tempAvg: 15, description: 'Keine Daten', humidity: 60, wind: 3 };
  }
};

// ============================================================
// 🇨🇭 Feiertag
// ============================================================
const getSwissHoliday = (date = new Date()) => {
  const hd = new Holidays('CH');
  const holiday = hd.isHoliday(date);
  return holiday ? holiday.name : null;
};

// ============================================================
// 🔮 Nachfrageprognose
// ============================================================
const getDemandForecast = async (req, res) => {
  try {
    const restaurantId = req.user?.restaurantId;
    console.log('🔍 Forecast requested for restaurant:', restaurantId);

    if (!restaurantId)
      return res.status(400).json({ success: false, message: 'Kein Restaurant zugeordnet' });

    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant)
      return res.status(404).json({ success: false, message: 'Restaurant nicht gefunden' });

    const now = new Date();
    const startDate = dayjs().subtract(8, 'weeks').toDate();

    const sales = await Sale.findAll({
      where: { restaurantId, saleDate: { [Op.between]: [startDate, now] } },
      raw: true,
    });

    const totalRevenue = sales.reduce((s, r) => s + parseFloat(r.totalPrice || 0), 0);
    const diffDays = Math.max(1, Math.ceil((now - startDate) / (1000 * 60 * 60 * 24)));
    const avgRevenuePerDay = totalRevenue / diffDays;

    const weather = await getWeatherForecast(restaurant);
    const holiday = getSwissHoliday(now);

    // 🎪 NEW: GET REAL EVENTS using GPS coordinates
    let nearbyEvents = [];
    let eventsContext = 'Keine Events in der Nähe gefunden';
    
    try {
      if (restaurant.latitude && restaurant.longitude) {
        console.log(`🗺️ Searching REAL events near ${restaurant.name} at GPS: ${restaurant.latitude}, ${restaurant.longitude}`);
        nearbyEvents = await realEventService.getEventsNearRestaurant(restaurant, 10);
        console.log(`✅ Found ${nearbyEvents.length} REAL events nearby`);
        
        if (nearbyEvents.length > 0) {
          eventsContext = nearbyEvents.map(event => {
            const distance = event.distanceKm ? `${event.distanceKm.toFixed(1)}km` : '?km';
            const attendees = event.attendeeCount ? `${event.attendeeCount} Besucher` : '';
            const venue = event.venue?.name ? `@ ${event.venue.name}` : '';
            return `- ${event.name} (${event.category}): ${event.startDate.split('T')[0]}, ${distance} entfernt ${venue} ${attendees}`.trim();
          }).join('\n');
        }
      } else {
        console.log(`⚠️ No GPS coordinates for ${restaurant.name} - skipping event detection`);
      }
    } catch (eventError) {
      console.error('⚠️ Event detection failed:', eventError.message);
    }

    // 🧠 ENHANCED AI Prompt with REAL Events
    const aiPrompt = `
Analysiere die Restaurantnachfrage für ${restaurant.name} in ${restaurant.city || 'unbekannter Ort'}.
GPS Location: ${restaurant.latitude || 'N/A'}, ${restaurant.longitude || 'N/A'}
Adresse: ${restaurant.address || 'Unbekannt'}

UMSATZDATEN (letzte 8 Wochen):
- Gesamtumsatz: CHF ${totalRevenue.toFixed(2)}
- Durchschnitt/Tag: CHF ${avgRevenuePerDay.toFixed(2)}
- Anzahl Verkäufe: ${sales.length}

WETTER:
- Temperatur: ${weather.tempAvg}°C
- Bedingungen: ${weather.description}
- Luftfeuchtigkeit: ${weather.humidity}%

FEIERTAGE: ${holiday || 'Keiner'}

🎪 ECHTE EVENTS IN DER NÄHE (via GPS APIs):
${eventsContext}

EVENT STATISTIK:
- ${nearbyEvents.length} Events im 10km Radius gefunden
- Event Kategorien: ${[...new Set(nearbyEvents.map(e => e.category))].join(', ') || 'keine'}
- Nächstes Event: ${nearbyEvents[0]?.distanceKm?.toFixed(1) || 'N/A'}km entfernt

Erstelle eine Prognose für die kommenden 7 Tage mit folgenden Daten:
{
 "summary": "Kurzbeschreibung der Nachfragesituation inklusive Event-Impacts",
 "expectedCustomers": Zahl (geschätzte durchschnittliche Gäste pro Tag),
 "confidence": Zahl (0–100, Vertrauensniveau),
 "weeklyData": [
   {"date": "YYYY-MM-DD", "predictedCustomers": Zahl, "historicalAvg": Zahl}
 ],
 "recommendations": ["Event-spezifische Empfehlung1","Geschäfts-Tipp2"],
 "influences": [
   {"factor": "Event Name (Quelle)", "impact": Zahl}, 
   {"factor": "Wetter", "impact": Zahl}, 
   {"factor": "Wochentag", "impact": Zahl}
 ],
 "eventHighlights": ["Event-Insight1", "Event-Insight2"]
}

WICHTIG: Berücksichtige die ECHTEN Events in deiner Analyse. Wenn große Events in der Nähe sind, erhöhe die Kundenprognose entsprechend.
`;

    let aiResponse;

    if (useClaude) {
      const msg = await anthropic.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
        max_tokens: 3000,
        temperature: 0.3,
        system: 'Du bist ein Restaurant-Business-Analyst mit Expertise in Event-Marketing. Analysiere ECHTE Events aus APIs. Antworte nur mit validem JSON.',
        messages: [{ role: 'user', content: aiPrompt }],
      });
      aiResponse = msg.content[0]?.text || '{}';
    } else if (openai) {
      const comp = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: aiPrompt }],
        temperature: 0.3,
        max_tokens: 2000,
      });
      aiResponse = comp.choices[0].message.content;
    } else {
      // Enhanced fallback with event consideration
      const eventBoost = nearbyEvents.reduce((boost, event) => {
        const eventImpact = event.impact || 10;
        const timeWeight = new Date(event.startDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 1 : 0.5;
        return boost + (eventImpact * timeWeight);
      }, 0);

      aiResponse = JSON.stringify({
        summary: `Fallback-Analyse: ${nearbyEvents.length} Events gefunden, ${eventBoost.toFixed(0)}% Event-Impact`,
        expectedCustomers: Math.round((avgRevenuePerDay / 10 + 20) * (1 + eventBoost / 100)),
        confidence: nearbyEvents.length > 0 ? 75 : 70,
        recommendations: nearbyEvents.length > 0 
          ? ['Event-Marketing nutzen', 'Personal für Event-Zeiten aufstocken']
          : ['Keine Events - eigene Events organisieren', 'Social Media verstärken'],
        influences: [
          { factor: 'Events in der Nähe', impact: eventBoost },
          { factor: 'Wetter', impact: weather.tempAvg > 20 ? 10 : -5 }
        ],
        eventHighlights: nearbyEvents.slice(0, 2).map(e => `${e.name}: ${e.category} Event`)
      });
    }

    const forecast = JSON.parse(
      aiResponse.replace(/```json/g, '').replace(/```/g, '').trim()
    );

    console.log('📊 Forecast parsed:', forecast);

    // Generate smart 7-day forecast
    const today = new Date();
    const weeklyData = forecast.weeklyData && forecast.weeklyData.length > 0
      ? forecast.weeklyData
      : Array.from({ length: 7 }, (_, i) => {
          const date = new Date(today);
          date.setDate(today.getDate() + i);

          const base = forecast.expectedCustomers || 20;
          const dayOfWeek = date.getDay();
          const weekendBoost = dayOfWeek === 0 || dayOfWeek === 6 ? 1.25 : 1.0;
          
          // Check for events on this day
          const dayEvents = nearbyEvents.filter(event => {
            const eventDate = new Date(event.startDate);
            return eventDate.toDateString() === date.toDateString();
          });
          const eventBoost = dayEvents.reduce((boost, event) => boost + (event.impact || 0), 0) / 100;
          
          const predicted = Math.round(base * weekendBoost * (1 + eventBoost) + (Math.random() * 3 - 1));

          return {
            date: date.toISOString().split('T')[0],
            predictedCustomers: Math.max(5, predicted),
            historicalAvg: Math.round(base * 0.9)
          };
        });

    // Enhanced response with event data
    res.json({
      success: true,
      data: {
        avgCustomers: forecast.expectedCustomers || 0,
        confidence: forecast.confidence || 70,
        summary: forecast.summary || 'Keine AI-Zusammenfassung',
        weeklyData,
        influenceFactors: forecast.influences || [],
        recommendations: forecast.recommendations || [],
        eventHighlights: forecast.eventHighlights || [],
        weather,
        holiday,
        
        // NEW: Real events data for frontend
        realEventsData: {
          totalEvents: nearbyEvents.length,
          events: nearbyEvents.slice(0, 5),
          searchRadius: 10,
          gpsCoordinates: { 
            lat: restaurant.latitude, 
            lng: restaurant.longitude 
          }
        }
      }
    });
  } catch (err) {
    console.error('❌ Forecast Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};


// ============================================================
// 📅 KI-Schichtplan Optimierung basierend auf Forecast
// ============================================================
const generateOptimalSchedule = async (req, res) => {
  try {
    const { week, preferences = {}, constraints = {} } = req.body;
    const restaurantId = req.user?.restaurantId;

    const restaurant = await Restaurant.findByPk(restaurantId);
    if (!restaurant)
      return res.status(404).json({ success: false, message: 'Restaurant nicht gefunden' });

    // Forecast holen
    const forecastUrl = `${process.env.FRONTEND_URL || 'https://localhost:3000'}/api/v1/ai/forecast`;
    const forecastResponse = await axios.get(forecastUrl, {
      headers: { Authorization: req.headers.authorization },
      httpsAgent: new (require('https').Agent)({ rejectUnauthorized: false }),
    });
    const forecastData = forecastResponse.data.data;

    const schedulePrompt = `
Erstelle einen optimalen Wochen-Schichtplan für das Restaurant "${restaurant.name}".
Erwarte ca. ${forecastData.avgCustomers || 40} Gäste pro Tag (${forecastData.confidence}% Zuverlässigkeit).
Wetter: ${forecastData.weather?.description || 'keine Daten'}.
Präferenzen: ${JSON.stringify(preferences)}.
Einschränkungen: ${JSON.stringify(constraints)}.
Erzeuge JSON:
{
 "week": "${week || '2025-W45'}",
 "shifts": [{"day":"Montag","role":"Koch","start":"10:00","end":"18:00","employee":"Max Muster"}],
 "summary":"Text",
 "recommendations":["Text1","Text2"]
}`;

    let aiSchedule;

    if (useClaude) {
      const msg = await anthropic.messages.create({
        model: process.env.CLAUDE_MODEL || 'claude-3-sonnet-20240229',
        max_tokens: 2500,
        temperature: 0.4,
        system: 'Du bist ein erfahrener Restaurant-Planer. Antworte mit validem JSON.',
        messages: [{ role: 'user', content: schedulePrompt }],
      });
      aiSchedule = msg.content[0]?.text || '{}';
    } else if (openai) {
      const comp = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: schedulePrompt }],
        temperature: 0.4,
        max_tokens: 1500,
      });
      aiSchedule = comp.choices[0].message.content;
    } else {
      aiSchedule = JSON.stringify({
        week,
        shifts: [
          { day: 'Montag', role: 'Koch', start: '10:00', end: '18:00', employee: 'Fallback' },
          { day: 'Freitag', role: 'Service', start: '12:00', end: '22:00', employee: 'Fallback' },
        ],
        summary: 'Fallback-Plan ohne KI erstellt',
        recommendations: ['KI-Integration aktivieren für optimale Planung'],
      });
    }

    const schedule = JSON.parse(aiSchedule.replace(/```json/g, '').replace(/```/g, '').trim());
    schedule.generatedAt = new Date().toISOString();
    schedule.generatedBy = useClaude ? 'claude' : openai ? 'openai' : 'fallback';

    res.json({ success: true, data: schedule });
  } catch (err) {
    console.error('❌ Schedule Error:', err.message);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ============================================================
// 📤 EXPORTS
// ============================================================
module.exports = {
  getDemandForecast,
  generateOptimalSchedule,
};
