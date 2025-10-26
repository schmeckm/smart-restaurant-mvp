// backend/src/services/claudeAIService.js
// MULTILINGUAL CLAUDE AI SERVICE

const Anthropic = require('@anthropic-ai/sdk');

class ClaudeAIService {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

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
    try {
      console.log(`🤖 Generating ${language.toUpperCase()} recipe for: ${productName}`);
      
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

      const response = await this.client.messages.create({
        model: 'claude-3-sonnet-20240229',
        max_tokens: 2000,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const content = response.content[0].text;
      console.log('✅ Claude AI response received, parsing JSON...');

      // Extract JSON from response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in AI response');
      }

      const recipeData = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!recipeData.name || !recipeData.ingredients || !recipeData.instructions) {
        throw new Error('Invalid recipe structure from AI');
      }

      console.log(`✅ ${language.toUpperCase()} recipe generated successfully:`, recipeData.name);

      return {
        success: true,
        data: {
          ...recipeData,
          language: language,
          generatedAt: new Date().toISOString(),
          generatedBy: 'claude-ai'
        }
      };

    } catch (error) {
      console.error('❌ Claude AI Error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  buildRecipePrompt({ productName, productDescription, servings, cuisine, difficulty, language = 'de', dietaryRestrictions, customInstructions }) {
    // Language configurations
    const languageConfig = {
      'de': {
        units: 'Gramm (g), Milliliter (ml), Liter (l), Esslöffel (EL), Teelöffel (TL), Stück',
        instruction: 'Erstelle das Rezept komplett auf Deutsch. Alle Zutaten und Anweisungen auf Deutsch.',
        style: 'traditionell deutsch',
        nameExample: 'Klassische Pizza Margherita',
        descExample: 'Ein köstliches italienisches Gericht mit frischen Zutaten',
        unitExamples: 'z.B. 300g, 200ml, 2 EL, 1 TL'
      },
      'en': {
        units: 'cups, tablespoons (tbsp), teaspoons (tsp), ounces (oz), pounds (lb), pieces',
        instruction: 'Create the recipe completely in English. All ingredients and instructions in English.',
        style: 'traditional english',
        nameExample: 'Classic Pizza Margherita',
        descExample: 'A delicious Italian dish with fresh ingredients',
        unitExamples: 'e.g. 2 cups, 3 tbsp, 1 tsp'
      },
      'it': {
        units: 'grammi (g), millilitri (ml), cucchiai (cucchiai), cucchiaini (cucchiaini), pezzi',
        instruction: 'Crea la ricetta completamente in italiano. Tutti gli ingredienti e le istruzioni in italiano.',
        style: 'tradizionale italiano',
        nameExample: 'Pizza Margherita Classica',
        descExample: 'Un delizioso piatto italiano con ingredienti freschi',
        unitExamples: 'es. 300g, 200ml, 2 cucchiai'
      },
      'fr': {
        units: 'grammes (g), millilitres (ml), cuillères à soupe (c. à s.), cuillères à café (c. à c.), pièces',
        instruction: 'Créez la recette entièrement en français. Tous les ingrédients et instructions en français.',
        style: 'traditionnel français',
        nameExample: 'Pizza Margherita Classique',
        descExample: 'Un délicieux plat italien avec des ingrédients frais',
        unitExamples: 'ex. 300g, 200ml, 2 c. à s.'
      }
    };

    const config = languageConfig[language] || languageConfig['de'];

    const dietaryNote = dietaryRestrictions.length > 0 
      ? `\n- Dietary restrictions: ${dietaryRestrictions.join(', ')}` 
      : '';

    const customNote = customInstructions 
      ? `\n- Special instructions: ${customInstructions}` 
      : '';

    return `You are a professional chef and recipe developer. ${config.instruction}

RECIPE REQUEST:
- Dish: ${productName}
${productDescription ? `- Description: ${productDescription}` : ''}
- Servings: ${servings}
- Cuisine: ${cuisine} (${config.style})
- Difficulty: ${difficulty}
- Language: ${language.toUpperCase()}${dietaryNote}${customNote}

MEASUREMENT UNITS TO USE: ${config.units}
Examples: ${config.unitExamples}

${config.instruction}

IMPORTANT: Respond ONLY with valid JSON in this exact format:

{
  "name": "${config.nameExample}",
  "description": "${config.descExample}",
  "prepTime": 20,
  "cookTime": 15,
  "servings": ${servings},
  "difficulty": "${difficulty}",
  "cuisine": "${cuisine}",
  "ingredients": [
    {
      "name": "ingredient name in ${language}",
      "quantity": 300,
      "unit": "g",
      "notes": "optional notes in ${language}"
    }
  ],
  "instructions": [
    "Step 1 in ${language}...",
    "Step 2 in ${language}..."
  ],
  "tags": ["${cuisine}", "${difficulty}"],
  "nutrition": {
    "calories": 450,
    "protein": 15,
    "carbs": 35,
    "fat": 20
  }
}

Requirements:
- Use authentic ${cuisine} cuisine ingredients and techniques
- ${config.instruction}
- Use ${config.units} measurement units
- Be specific with quantities and cooking times
- Include 5-8 detailed cooking steps
- Provide realistic nutrition values per serving`;
  }
}

module.exports = new ClaudeAIService();