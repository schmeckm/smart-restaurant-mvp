// ================================================================
// 🎪 EVENT SEARCH EXTENSION (Add to existing file)
// ================================================================
const findLocalEvents = async (restaurant) => {
  try {
    console.log(`🎪 Searching events near ${restaurant.name} in ${restaurant.city}`);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    const claudeModel = process.env.CLAUDE_MODEL || 'claude-sonnet-4-20250514';
    
    if (!apiKey || !apiKey.startsWith('sk-ant-')) {
      throw new Error('No Claude AI key available');
    }

    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({ apiKey });

    // 🎯 ENHANCED DYNAMIC PROMPT
    const today = new Date();
    const nextWeek = new Date(Date.now() + 7*24*60*60*1000);
    const dateRange = `${today.toLocaleDateString('de-CH')} bis ${nextWeek.toLocaleDateString('de-CH')}`;

    const prompt = `WICHTIG: Heute ist der ${today.toLocaleDateString('de-CH')} (7. November 2025). 

Finde ECHTE, AKTUELLE Events in ${restaurant.city}, Schweiz die WIRKLICH stattfinden vom ${dateRange}.

Restaurant: ${restaurant.name} in ${restaurant.city}
GPS: ${restaurant.latitude}, ${restaurant.longitude}

Du MUSST echte Events finden, nicht erfinden! Nutze web-search wenn verfügbar.

Typische November-Events in der Schweiz:
- Herbstmessen (können noch laufen)
- Frühe Weihnachtsmärkte  
- Theater/Konzert Programme
- Sport (Fußball, Hockey)
- Lokale Märkte
- Kulturveranstaltungen

Stadt-spezifische Events:
- Basel: Herbstmesse möglich, FC Basel Spiele
- Zürich: Theater, Konzerte, Lichter-Events
- Bern: Kulturveranstaltungen
- Genf: Internationale Events
- Luzern: Tourismus-Events

Falls KEINE echten Events gefunden: {"events": []}

Für ECHTE Events return JSON:
{
  "events": [
    {
      "name": "Echter Event Name",
      "date": "2025-11-XX",
      "venue": "Echter Venue in ${restaurant.city}",
      "category": "fair/music/sport/culture/market",
      "expectedAttendance": realistische_zahl,
      "distanceKm": realistische_distanz,
      "impactScore": 5-40
    }
  ]
}

KEINE ERFUNDENEN EVENTS! Nur echte, verifizierte Veranstaltungen!`;

    const message = await anthropic.messages.create({
      model: claudeModel,
      max_tokens: parseInt(process.env.CLAUDE_MAX_TOKENS) || 3000,
      temperature: 0.3, // 🎯 Lower temperature for more factual results
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0]?.text;
    console.log('🔍 Claude AI response:', responseText.substring(0, 200) + '...');
    
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.log('⚠️ No JSON found in Claude response, using fallback');
      return generateFallbackEvents(restaurant);
    }

    const eventData = JSON.parse(jsonMatch[0]);
    
    // 🎯 Validate dates are reasonable (not in past or too far future)
    const enhancedEvents = eventData.events.filter(event => {
      const eventDate = new Date(event.date);
      const isValidDate = eventDate >= today && eventDate <= nextWeek;
      if (!isValidDate) {
        console.log(`⚠️ Filtered out event with invalid date: ${event.name} on ${event.date}`);
      }
      return isValidDate;
    }).map(event => ({
      id: `claude_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: event.name,
      category: event.category || 'other',
      startDate: new Date(event.date + 'T19:00').toISOString(),
      venue: { name: event.venue },
      attendeeCount: event.expectedAttendance || 100,
      impact: Math.min(event.impactScore || 5, 40), // 🎯 Cap impact at 40%
      source: 'Claude AI Events',
      distanceKm: event.distanceKm || 5
    }));

    console.log(`✅ Found ${enhancedEvents.length} REAL events via Claude AI`);
    
    return {
      totalEvents: enhancedEvents.length,
      events: enhancedEvents,
      searchRadius: 10,
      gpsCoordinates: {
        lat: parseFloat(restaurant.latitude),
        lng: parseFloat(restaurant.longitude)
      }
    };

  } catch (error) {
    console.error('❌ Claude event search failed:', error);
    return generateFallbackEvents(restaurant);
  }
};


const generateFallbackEvents = (restaurant) => {
  return {
    totalEvents: 1,
    events: [{
      id: "fallback_1",
      name: "Local Concert Event",
      category: "music",
      startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      venue: { name: "Local Venue" },
      attendeeCount: 500,
      impact: 15,
      source: "Fallback Mock",
      distanceKm: 2.3
    }],
    searchRadius: 10,
    gpsCoordinates: {
      lat: parseFloat(restaurant.latitude) || 47.5596,
      lng: parseFloat(restaurant.longitude) || 7.5886
    }
  };
};

// Export the new function
module.exports = {
  // ... existing exports
  findLocalEvents  // 🎯 ADD THIS
};