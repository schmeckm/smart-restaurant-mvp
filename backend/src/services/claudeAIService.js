// backend/src/services/claudeAIService.js
// OPTIMIZED MULTILINGUAL CLAUDE AI SERVICE WITH ROBUST JSON PARSING

const Anthropic = require('@anthropic-ai/sdk');

class ClaudeAIService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  // ======== PUBLIC METHOD ========
  async generateRecipe({
    productName,
    productDescription = '',
    servings = 4,
    cuisine = 'international',
    difficulty = 'medium',
    language = 'de',
    dietaryRestrictions = [],
    customInstructions = ''
  }) {
    const sanitize = (str) =>
      typeof str === 'string' ? str.replace(/[{}[\]<>]/g, '').trim() : '';

    try {
      console.log(`🤖 Generating ${language.toUpperCase()} recipe for: ${productName}`);

      // sanitize user input
      productName = sanitize(productName);
      productDescription = sanitize(productDescription);
      customInstructions = sanitize(customInstructions);

      const prompt = this.buildRecipePrompt({
        productName,
        productDescription,
        servings,
        cuisine,
        difficulty,
        language,
        dietaryRestrictions,
        customInstructions
      });

      const temperature =
        difficulty === 'easy'
          ? 0.4
          : difficulty === 'hard'
          ? 0.9
          : 0.7;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);

      const response = await this.client.messages.create(
        {
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 2000,
          temperature,
          messages: [{ role: 'user', content: prompt }]
        },
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      const content = response.content?.[0]?.text || '';
      if (!content) throw new Error('Empty response from Claude AI');

      let recipeData;
      try {
        const jsonString = content.replace(/```json|```/g, '').trim();
        recipeData = JSON.parse(jsonString);
      } catch (parseErr) {
        console.error('❌ JSON parse error:', parseErr.message);
        throw new Error(`Invalid JSON structure from AI: ${parseErr.message}`);
      }

      if (
        typeof recipeData.name !== 'string' ||
        !Array.isArray(recipeData.ingredients) ||
        !Array.isArray(recipeData.instructions)
      ) {
        throw new Error('Invalid recipe structure from AI response');
      }

      console.log(`✅ ${language.toUpperCase()} recipe generated successfully:`, recipeData.name);

      return {
        success: true,
        data: {
          ...recipeData,
          language,
          generatedAt: new Date().toISOString(),
          generatedBy: 'claude-ai'
        }
      };
    } catch (error) {
      console.error('❌ Claude AI Error:', error.message);
      return { success: false, error: error.message };
    }
  }

  // ======== PUBLIC METHOD ========
  async generateNutritionForIngredient(ingredientName, language = 'de') {
    try {
      console.log(`🥦 Fetching Nutrition Data via Claude for: ${ingredientName}`);

      const prompt = `
        Du bist ein Ernährungswissenschaftler. Gib die durchschnittlichen Nährwerte pro 100g 
        für die Zutat "${ingredientName}" zurück.
        Antworte ausschließlich als JSON mit:
        { "calories": Zahl, "protein": Zahl, "fat": Zahl, "carbohydrates": Zahl, "fiber": Zahl, "sugar": Zahl }
      `;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const response = await this.client.messages.create(
        {
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 300,
          temperature: 0.2,
          messages: [{ role: 'user', content: prompt }]
        },
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      const text = response.content?.[0]?.text?.trim() || '';
      if (!text) throw new Error('Empty nutrition response from Claude');

      const jsonText = text.replace(/```json|```/g, '').trim();
      const nutritionData = JSON.parse(jsonText);

      if (typeof nutritionData.calories !== 'number') {
        throw new Error('Invalid structure (missing calories)');
      }

      console.log(`✅ Nutrition Data for "${ingredientName}" loaded successfully`);
      return nutritionData;

    } catch (error) {
      console.error(`❌ Claude Nutrition Error for "${ingredientName}":`, error.message);
      return { calories: 0, protein: 0, fat: 0, carbohydrates: 0, fiber: 0, sugar: 0, error: error.message };
    }
  }

  // ======== PUBLIC METHOD: getDemandSignal ========
  async getDemandSignal(restaurant = {}) {
    try {
      const city = restaurant.city || 'Basel';
      const country = restaurant.country || 'CH';

      console.log(`📈 Requesting Demand Signal for ${city}, ${country} from Claude AI`);

      const prompt = `
Analysiere lokale Ereignisse, gesellschaftliche Trends, Wetterbedingungen
und Sport-/TV-Events für die Region ${city}, ${country}, die die Restaurantbesuche beeinflussen könnten.
Erstelle eine JSON-Antwort im folgenden Format:
{
  "summary": "Kurze Gesamteinschätzung zur heutigen Nachfrage",
  "influences": [
    { "name": "Wetter", "impact": 3, "description": "Mildes Herbstwetter, mehr Außengastronomie" },
    { "name": "Sportevent", "impact": -2, "description": "Fußballspiel im Fernsehen lenkt Gäste ab" },
    { "name": "Abendprogramm", "impact": 4, "description": "Beliebte Show in der Innenstadt zieht Publikum" }
  ]
}
Antworte ausschließlich mit gültigem JSON, ohne Kommentare oder Zusatztexte.
`;

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25000);

      const response = await this.client.messages.create(
        {
          model: 'claude-3-5-haiku-20241022',
          max_tokens: 500,
          temperature: 0.5,
          messages: [{ role: 'user', content: prompt }]
        },
        { signal: controller.signal }
      );
      clearTimeout(timeout);

      const content = response.content?.[0]?.text?.trim() || '{}';
      let parsed;
      try {
        const jsonText = content.replace(/```json|```/g, '').trim();
        parsed = JSON.parse(jsonText);
      } catch {
        console.warn('⚠️ KI-Antwort war kein valides JSON:', content);
        parsed = {
          summary: 'Fallback-Demand-Prognose (kein valides JSON erhalten)',
          influences: [
            { name: 'Wetter', impact: 1, description: 'Neutrale Bedingungen' }
          ]
        };
      }

      return { success: true, data: parsed };
    } catch (error) {
      console.error('❌ Claude DemandSignal Error:', error.message);
      return {
        success: false,
        data: {
          summary: 'Fallback ohne KI',
          influences: [
            { name: 'Wetter', impact: 0, description: 'Keine Daten verfügbar' }
          ]
        }
      };
    }
  }

  // ======== PRIVATE HELPER ========
  buildRecipePrompt({
    productName,
    productDescription,
    servings,
    cuisine,
    difficulty,
    language = 'de',
    dietaryRestrictions,
    customInstructions
  }) {
    const languageConfig = {
      de: {
        units: 'Gramm (g), Milliliter (ml), Liter (l), Esslöffel (EL), Teelöffel (TL), Stück',
        instruction: 'Erstelle das Rezept komplett auf Deutsch.',
        style: 'traditionell deutsch'
      },
      en: {
        units: 'cups, tablespoons (tbsp), teaspoons (tsp), ounces (oz), pounds (lb)',
        instruction: 'Create the recipe completely in English.',
        style: 'traditional english'
      }
    };

    const cfg = languageConfig[language] || languageConfig.de;
    return `You are a professional chef. ${cfg.instruction}

RECIPE REQUEST:
- Dish: ${productName}
- Description: ${productDescription}
- Servings: ${servings}
- Cuisine: ${cuisine} (${cfg.style})
- Difficulty: ${difficulty}

Respond ONLY with valid JSON.`;
  }
}

module.exports = new ClaudeAIService();
