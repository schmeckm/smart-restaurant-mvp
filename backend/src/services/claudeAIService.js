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

      // dynamic creativity
      const temperature =
        difficulty === 'easy'
          ? 0.4
          : difficulty === 'hard'
          ? 0.9
          : 0.7;

      // timeout protection
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

      // structural validation
      if (
        typeof recipeData.name !== 'string' ||
        !Array.isArray(recipeData.ingredients) ||
        !Array.isArray(recipeData.instructions)
      ) {
        throw new Error('Invalid recipe structure from AI response');
      }

      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ ${language.toUpperCase()} recipe generated successfully:`, recipeData.name);
      }

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

  // ======== PRIVATE METHOD ========
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
        style: 'traditionell deutsch',
        nameExample: 'Klassische Pizza Margherita',
        descExample: 'Ein köstliches italienisches Gericht mit frischen Zutaten',
        unitExamples: 'z.B. 300g, 200ml, 2 EL, 1 TL'
      },
      en: {
        units: 'cups, tablespoons (tbsp), teaspoons (tsp), ounces (oz), pounds (lb), pieces',
        instruction: 'Create the recipe completely in English.',
        style: 'traditional english',
        nameExample: 'Classic Pizza Margherita',
        descExample: 'A delicious Italian dish with fresh ingredients',
        unitExamples: 'e.g. 2 cups, 3 tbsp, 1 tsp'
      },
      it: {
        units: 'grammi (g), millilitri (ml), cucchiai, cucchiaini, pezzi',
        instruction: 'Crea la ricetta completamente in italiano.',
        style: 'tradizionale italiano',
        nameExample: 'Pizza Margherita Classica',
        descExample: 'Un delizioso piatto italiano con ingredienti freschi',
        unitExamples: 'es. 300g, 200ml, 2 cucchiai'
      },
      fr: {
        units: 'grammes (g), millilitres (ml), cuillères à soupe (c. à s.), cuillères à café (c. à c.), pièces',
        instruction: 'Créez la recette entièrement en français.',
        style: 'traditionnel français',
        nameExample: 'Pizza Margherita Classique',
        descExample: 'Un délicieux plat italien avec des ingrédients frais',
        unitExamples: 'ex. 300g, 200ml, 2 c. à s.'
      }
    };

    const cfg = languageConfig[language] || languageConfig.de;
    const dietaryNote =
      dietaryRestrictions.length > 0
        ? `\n- Dietary restrictions: ${dietaryRestrictions.join(', ')}`
        : '';
    const customNote = customInstructions
      ? `\n- Special instructions: ${customInstructions}`
      : '';

    return `You are a professional chef and recipe developer. ${cfg.instruction}

RECIPE REQUEST:
- Dish: ${productName}
${productDescription ? `- Description: ${productDescription}` : ''}
- Servings: ${servings}
- Cuisine: ${cuisine} (${cfg.style})
- Difficulty: ${difficulty}
- Language: ${language.toUpperCase()}${dietaryNote}${customNote}

MEASUREMENT UNITS TO USE: ${cfg.units}
Examples: ${cfg.unitExamples}

IMPORTANT: Respond ONLY with valid JSON in this format:
{
  "name": "${cfg.nameExample}",
  "description": "${cfg.descExample}",
  "prepTime": 20,
  "cookTime": 15,
  "servings": ${servings},
  "difficulty": "${difficulty}",
  "cuisine": "${cuisine}",
  "ingredients": [
    { "name": "ingredient in ${language}", "quantity": 300, "unit": "g", "notes": "optional" }
  ],
  "instructions": ["Step 1 in ${language}...", "Step 2 in ${language}..."],
  "tags": ["${cuisine}", "${difficulty}"],
  "nutrition": { "calories": 450, "protein": 15, "carbs": 35, "fat": 20 }
}

Requirements:
- Use authentic ${cuisine} cuisine ingredients and techniques
- ${cfg.instruction}
- Use ${cfg.units}
- Include 5–8 detailed steps and realistic nutrition values.`;
  }
}

module.exports = new ClaudeAIService();
