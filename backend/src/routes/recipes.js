// backend/src/routes/recipes.js
const express = require('express');
const {
  getRecipes,
  getRecipe,
  getRecipeByProduct,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  addIngredientToRecipe,
  updateRecipeIngredient,
  removeIngredientFromRecipe,
  calculateRecipeCost,
  checkRecipeStock
} = require('../controllers/recipeController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// AI Recipe Generation (NEW!)
router.post('/generate-with-ai', async (req, res) => {
  try {
    const { productName, servings = 4, cuisine, difficulty } = req.body;

    if (!productName) {
      return res.status(400).json({
        success: false,
        message: 'Produktname ist erforderlich'
      });
    }

    // Check if Anthropic API key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'ANTHROPIC_API_KEY nicht konfiguriert'
      });
    }

    const Anthropic = require('@anthropic-ai/sdk');
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const prompt = `Du bist ein professioneller Restaurant-Koch. Erstelle ein detailliertes Rezept für "${productName}".

Anforderungen:
- Portionen: ${servings}
- Küche: ${cuisine || 'International'}
- Schwierigkeit: ${difficulty || 'Mittel'}

WICHTIG: Gib die Antwort als valides JSON zurück (ohne Markdown, ohne Backticks) mit dieser exakten Struktur:
{
  "name": "${productName}",
  "description": "Kurze, appetitliche Beschreibung des Gerichts",
  "servings": ${servings},
  "prepTime": 30,
  "cookTime": 45,
  "difficulty": "mittel",
  "cuisine": "${cuisine || 'International'}",
  "ingredients": [
    {
      "name": "Zutat",
      "quantity": 200,
      "unit": "g",
      "notes": "Optional: Hinweise zur Zutat"
    }
  ],
  "instructions": [
    "Schritt 1: Detaillierte Anleitung...",
    "Schritt 2: Detaillierte Anleitung..."
  ],
  "nutrition": {
    "calories": 450,
    "protein": 25,
    "carbs": 40,
    "fat": 15
  },
  "tags": ["tag1", "tag2"]
}

Achte auf realistische Mengen für ${servings} Portionen und professionelle Restaurant-Qualität.`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      temperature: 0.7,
      messages: [{
        role: "user",
        content: prompt
      }]
    });

    const responseText = message.content[0].text;
    console.log('AI Response:', responseText);

    // Extrahiere JSON aus der Antwort
    let recipeData;
    try {
      // Versuche direktes Parsing
      recipeData = JSON.parse(responseText);
    } catch (e) {
      // Falls Markdown-Wrapper vorhanden, extrahiere JSON
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        recipeData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Kein valides JSON in der AI-Antwort gefunden');
      }
    }

    res.json({
      success: true,
      data: recipeData,
      message: 'Rezept erfolgreich generiert'
    });

  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({
      success: false,
      message: 'Fehler bei der KI-Generierung',
      error: error.message
    });
  }
});

// Special routes first (before /:id routes)
router.get('/product/:productId', getRecipeByProduct);

// Recipe CRUD routes
router.route('/')
  .get(getRecipes)
  .post(createRecipe);

router.route('/:id')
  .get(getRecipe)
  .put(updateRecipe)
  .delete(deleteRecipe);

// Recipe analysis routes
router.get('/:id/cost', calculateRecipeCost);
router.get('/:id/check-stock', checkRecipeStock);

// Recipe ingredients management routes
router.post('/:id/ingredients', addIngredientToRecipe);
router.put('/:id/ingredients/:ingredientId', updateRecipeIngredient);
router.delete('/:id/ingredients/:ingredientId', removeIngredientFromRecipe);

module.exports = router;