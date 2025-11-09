// services/claudeEventService.js
import Anthropic from '@anthropic-ai/sdk'

const claude = new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
})

export async function findLocalEvents(restaurant) {
  const { latitude, longitude, city } = restaurant
  
  const message = await claude.messages.create({
    model: 'claude-3-sonnet-20240229',
    max_tokens: 1024,
    tools: [{ name: 'web_search' }], // 🎯 Web-Search aktivieren
    messages: [{
      role: 'user',
      content: `
        Suche aktuelle Events in ${city} (GPS: ${latitude}, ${longitude})
        für die nächsten 7 Tage. 
        
        Fokus auf Events die Restaurant-Gäste bringen könnten:
        - Konzerte, Festivals
        - Sportevents  
        - Märkte, Messen
        - Theater, Shows
        
        Schätze Besucherzahlen und Distanz zum Restaurant.
        Return strukturierte Daten.
      `
    }]
  })
  
  return parseEventResponse(message.content)
}