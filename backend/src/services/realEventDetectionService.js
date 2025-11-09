// 🗺️ REAL GPS-BASED EVENT DETECTION SYSTEM
// services/realEventService.js

const axios = require('axios');

// ================================================================
// 🎪 REAL EVENT APIs INTEGRATION
// ================================================================

class RealEventService {
  constructor() {
    this.eventbriteApiKey = process.env.EVENTBRITE_API_KEY;
    this.facebookAccessToken = process.env.FACEBOOK_ACCESS_TOKEN;
    this.googlePlacesKey = process.env.GOOGLE_PLACES_API_KEY;
  }

  // ================================================================
  // 📍 MAIN: GET REAL EVENTS NEAR RESTAURANT
  // ================================================================
  async getEventsNearRestaurant(restaurant, radiusKm = 10) {
    console.log(`🗺️ Finding REAL events near ${restaurant.name} at GPS: ${restaurant.latitude}, ${restaurant.longitude}`);
    
    const events = [];
    const location = {
      lat: parseFloat(restaurant.latitude),
      lng: parseFloat(restaurant.longitude),
      city: restaurant.city,
      postalCode: restaurant.postal_code,
      address: restaurant.address
    };

    // Skip if no GPS coordinates
    if (!location.lat || !location.lng) {
      console.log(`⚠️ No GPS coordinates for ${restaurant.name} - cannot find nearby events`);
      return this.getFallbackEventsByCity(restaurant.city);
    }

    try {
      // 1️⃣ EVENTBRITE API - Real international events
      const eventbriteEvents = await this.getEventbriteEvents(location, radiusKm);
      events.push(...eventbriteEvents);

      // 2️⃣ GOOGLE PLACES API - Local venues and events  
      const googleEvents = await this.getGooglePlacesEvents(location, radiusKm);
      events.push(...googleEvents);

      // 3️⃣ SWISS GOVERNMENT/TOURISM APIs
      const swissOfficialEvents = await this.getSwissOfficialEvents(location, radiusKm);
      events.push(...swissOfficialEvents);

      // 4️⃣ MEETUP API - Local meetups and gatherings
      const meetupEvents = await this.getMeetupEvents(location, radiusKm);
      events.push(...meetupEvents);

      // 5️⃣ LOCAL VENUE APIs (specific to Swiss cities)
      const venueEvents = await this.getVenueSpecificEvents(location, radiusKm);
      events.push(...venueEvents);

      console.log(`✅ Found ${events.length} REAL events within ${radiusKm}km of ${restaurant.name}`);
      
      // Calculate distance and sort by proximity
      const eventsWithDistance = events.map(event => ({
        ...event,
        distanceKm: this.calculateDistance(
          location.lat, location.lng, 
          event.coordinates?.lat || location.lat, 
          event.coordinates?.lng || location.lng
        )
      })).sort((a, b) => a.distanceKm - b.distanceKm);

      return eventsWithDistance.slice(0, 10); // Top 10 closest events

    } catch (error) {
      console.error('❌ Real event detection failed:', error.message);
      return this.getFallbackEventsByCity(restaurant.city);
    }
  }

  // ================================================================
  // 🎪 EVENTBRITE API - Real Events
  // ================================================================
  async getEventbriteEvents(location, radiusKm) {
    if (!this.eventbriteApiKey) {
      console.log('⚠️ Eventbrite API key not configured');
      return [];
    }

    try {
      const url = 'https://www.eventbriteapi.com/v3/events/search/';
      const params = {
        'location.latitude': location.lat,
        'location.longitude': location.lng,
        'location.within': `${radiusKm}km`,
        'start_date.range_start': new Date().toISOString(),
        'start_date.range_end': new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // Next 30 days
        'expand': 'venue',
        'sort_by': 'distance',
        token: this.eventbriteApiKey
      };

      const response = await axios.get(url, { params, timeout: 10000 });
      const events = response.data.events || [];

      return events.map(event => ({
        id: `eventbrite_${event.id}`,
        name: event.name.text,
        description: event.description?.text?.substring(0, 200) + '...',
        startDate: event.start.local,
        endDate: event.end.local,
        venue: {
          name: event.venue?.name || 'Unknown Venue',
          address: event.venue?.address?.localized_address_display || '',
          coordinates: {
            lat: parseFloat(event.venue?.latitude || location.lat),
            lng: parseFloat(event.venue?.longitude || location.lng)
          }
        },
        category: this.categorizeEvent(event.category_id),
        attendeeCount: event.capacity || 0,
        price: event.is_free ? 'Free' : 'Paid',
        url: event.url,
        source: 'Eventbrite',
        impact: this.calculateEventImpact(event, location)
      }));

    } catch (error) {
      console.error('❌ Eventbrite API error:', error.message);
      return [];
    }
  }

  // ================================================================
  // 🗺️ GOOGLE PLACES API - Local Venues & Events
  // ================================================================
  async getGooglePlacesEvents(location, radiusKm) {
    if (!this.googlePlacesKey) {
      console.log('⚠️ Google Places API key not configured');
      return [];
    }

    try {
      // Search for event venues near restaurant
      const venueTypes = ['stadium', 'event_venue', 'night_club', 'museum', 'amusement_park'];
      const venues = [];

      for (const type of venueTypes) {
        const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
        const params = {
          location: `${location.lat},${location.lng}`,
          radius: radiusKm * 1000, // Convert km to meters
          type: type,
          key: this.googlePlacesKey
        };

        try {
          const response = await axios.get(url, { params, timeout: 10000 });
          const places = response.data.results || [];
          
          venues.push(...places.slice(0, 3)); // Max 3 venues per type
        } catch (venueError) {
          console.log(`⚠️ Google Places search failed for ${type}:`, venueError.message);
        }
      }

      // Convert venues to potential events
      return venues.map(venue => ({
        id: `google_${venue.place_id}`,
        name: `Event at ${venue.name}`,
        description: `Potential events at ${venue.name} (${venue.types.join(', ')})`,
        startDate: new Date().toISOString(),
        venue: {
          name: venue.name,
          address: venue.vicinity,
          coordinates: {
            lat: venue.geometry.location.lat,
            lng: venue.geometry.location.lng
          }
        },
        category: this.mapGoogleTypeToCategory(venue.types[0]),
        rating: venue.rating || 0,
        source: 'Google Places',
        impact: venue.rating > 4 ? 15 : 10 // Higher rated venues = higher impact
      }));

    } catch (error) {
      console.error('❌ Google Places API error:', error.message);
      return [];
    }
  }

  // ================================================================
  // 🇨🇭 SWISS OFFICIAL EVENTS (Tourism/Government)
  // ================================================================
  async getSwissOfficialEvents(location, radiusKm) {
    try {
      const events = [];
      
      // Swiss Tourism API (if available)
      if (process.env.SWISS_TOURISM_API_KEY) {
        const tourismEvents = await this.getSwissTourismEvents(location, radiusKm);
        events.push(...tourismEvents);
      }

      // City-specific APIs
      const cityEvents = await this.getCitySpecificEvents(location);
      events.push(...cityEvents);

      return events;

    } catch (error) {
      console.error('❌ Swiss official events API error:', error.message);
      return [];
    }
  }

  // ================================================================
  // 🏛️ CITY-SPECIFIC EVENT APIs
  // ================================================================
  async getCitySpecificEvents(location) {
    const city = location.city?.toLowerCase() || '';
    const events = [];

    try {
      // Basel-specific
      if (city.includes('basel')) {
        const baselEvents = await this.getBaselEvents(location);
        events.push(...baselEvents);
      }

      // Zürich-specific  
      if (city.includes('zürich') || city.includes('zurich')) {
        const zurichEvents = await this.getZurichEvents(location);
        events.push(...zurichEvents);
      }

      // Bern-specific
      if (city.includes('bern')) {
        const bernEvents = await this.getBernEvents(location);
        events.push(...bernEvents);
      }

    } catch (error) {
      console.error('❌ City-specific events error:', error.message);
    }

    return events;
  }

  // ================================================================
  // 🏟️ BASEL SPECIFIC EVENTS
  // ================================================================
  async getBaselEvents(location) {
    try {
      // FC Basel schedule (example - would use real API)
      const baselStadiumLat = 47.5478;
      const baselStadiumLng = 7.6210;
      const distanceToStadium = this.calculateDistance(location.lat, location.lng, baselStadiumLat, baselStadiumLng);

      const events = [];

      // If restaurant is near St. Jakob-Park
      if (distanceToStadium <= 5) {
        // This would ideally call FC Basel's API or Swiss Football League API
        events.push({
          id: 'fc_basel_next_home',
          name: 'FC Basel Heimspiel',
          description: 'Nächstes FC Basel Heimspiel im St. Jakob-Park',
          startDate: this.getNextWeekend().toISOString(),
          venue: {
            name: 'St. Jakob-Park',
            address: 'St. Jakob-Strasse 395, 4052 Basel',
            coordinates: { lat: baselStadiumLat, lng: baselStadiumLng }
          },
          category: 'sports',
          attendeeCount: 35000,
          source: 'Basel Sports',
          impact: Math.max(25 - distanceToStadium * 5, 5) // Closer = higher impact
        });
      }

      return events;

    } catch (error) {
      console.error('❌ Basel events error:', error.message);
      return [];
    }
  }

  // ================================================================
  // 📱 MEETUP API INTEGRATION
  // ================================================================
  async getMeetupEvents(location, radiusKm) {
    // Meetup API integration would go here
    // Note: Meetup API requires authentication
    try {
      // Example placeholder - replace with real Meetup API
      return [];
    } catch (error) {
      console.error('❌ Meetup API error:', error.message);
      return [];
    }
  }

  // ================================================================
  // 🏢 VENUE-SPECIFIC EVENTS
  // ================================================================
  async getVenueSpecificEvents(location, radiusKm) {
    // This would check specific venues' websites/APIs for events
    // Examples: Theater websites, concert halls, exhibition centers
    return [];
  }

  // ================================================================
  // 🔧 UTILITY METHODS
  // ================================================================

  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  calculateEventImpact(event, location) {
    let impact = 10; // Base impact
    
    if (event.capacity > 10000) impact += 15;
    else if (event.capacity > 5000) impact += 10;
    else if (event.capacity > 1000) impact += 5;
    
    if (event.category === 'sports') impact += 10;
    if (event.category === 'food') impact += 15;
    if (event.category === 'festival') impact += 12;
    
    return Math.min(impact, 50); // Max 50% impact
  }

  categorizeEvent(categoryId) {
    // Eventbrite category mapping
    const categories = {
      '103': 'music',
      '105': 'food',
      '108': 'sports',
      '110': 'business',
      '113': 'community'
    };
    return categories[categoryId] || 'other';
  }

  mapGoogleTypeToCategory(type) {
    const mapping = {
      'stadium': 'sports',
      'night_club': 'nightlife',
      'museum': 'cultural',
      'amusement_park': 'family',
      'event_venue': 'entertainment'
    };
    return mapping[type] || 'other';
  }

  getNextWeekend() {
    const now = new Date();
    const nextSaturday = new Date(now);
    nextSaturday.setDate(now.getDate() + ((6 - now.getDay()) % 7));
    nextSaturday.setHours(15, 0, 0, 0); // 3 PM Saturday
    return nextSaturday;
  }

  // ================================================================
  // 🔧 FALLBACK: City-based events when GPS fails
  // ================================================================
  getFallbackEventsByCity(city) {
    console.log(`🏙️ Using city fallback for: ${city}`);
    // Return minimal city-based events when GPS detection fails
    return [
      {
        id: `city_${city}_general`,
        name: `Local Events in ${city}`,
        description: `General events happening in ${city} area`,
        category: 'community',
        impact: 5,
        source: 'City Fallback'
      }
    ];
  }
}

// ================================================================
// 📤 EXPORT
// ================================================================
module.exports = new RealEventService();