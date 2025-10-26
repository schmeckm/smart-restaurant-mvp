<!-- AIRecipeChat.vue ERWEITERT MIT MEHRSPRACHIGKEIT -->

<!-- TEIL 1: ADVANCED OPTIONS ERWEITERN -->
<!-- 
Finde in deiner AIRecipeChat.vue diese Sektion (um Zeile 233):
<div class="advanced-options">

Und erweitere sie so:
-->

<!-- Advanced Options (ERWEITERT) -->
<div class="advanced-options">
  <el-select v-model="cuisine" placeholder="Küche" size="small" style="width: 150px">
    <el-option label="International" value="International" />
    <el-option label="Italienisch" value="Italienisch" />
    <el-option label="Französisch" value="Französisch" />
    <el-option label="Deutsch" value="Deutsch" />
    <el-option label="Asiatisch" value="Asiatisch" />
    <el-option label="Indisch" value="Indisch" />
    <el-option label="Mexikanisch" value="Mexikanisch" />
  </el-select>

  <el-select v-model="difficulty" placeholder="Schwierigkeit" size="small" style="width: 150px">
    <el-option label="Einfach" value="Einfach" />
    <el-option label="Mittel" value="Mittel" />
    <el-option label="Schwer" value="Schwer" />
  </el-select>

  <!-- ========== NEU: SPRACH-AUSWAHL ========== -->
  <el-select v-model="recipeLanguage" placeholder="Sprache" size="small" style="width: 140px">
    <el-option label="🇩🇪 Deutsch" value="de" />
    <el-option label="🇬🇧 English" value="en" />
    <el-option label="🇮🇹 Italiano" value="it" />
    <el-option label="🇫🇷 Français" value="fr" />
  </el-select>
  <!-- ========================================== -->

  <el-button size="small" @click="clearChat" :disabled="messages.length === 0">
    <el-icon><Delete /></el-icon>
    Chat löschen
  </el-button>
</div>

<!--
TEIL 2: SCRIPT ERWEITERN

Finde in deiner AIRecipeChat.vue den <script> Bereich und erweitere die data() Funktion:
-->

<script>
export default {
  name: 'AIRecipeChat',
  data() {
    return {
      // ... alle deine bestehenden Variablen ...
      
      // ========== NEU: SPRACH-VARIABLE HINZUFÜGEN ==========
      recipeLanguage: 'de', // Standard: Deutsch
      // =====================================================
      
      // ... alle anderen bestehenden Variablen ...
    }
  },

  methods: {
    // ... alle deine bestehenden Methoden ...

    // ========== ERWEITERTE sendMessage/generateRecipe METHODE ==========
    async sendMessage() {
      if (!this.selectedProduct) {
        this.$message.error('Bitte wähle zuerst ein Produkt aus');
        return;
      }

      if (this.generating) return;

      const userMessage = this.userInput.trim();
      
      // Add user message if not empty
      if (userMessage) {
        this.addMessage('user', userMessage);
      }

      this.generating = true;
      this.userInput = '';

      // Add loading message with progress
      this.loadingMessage = this.getRandomLoadingMessage();
      this.loadingProgress = 0;
      this.addMessage('loading', '');

      // Progress simulation
      const progressInterval = setInterval(() => {
        if (this.loadingProgress < 90) {
          this.loadingProgress += Math.random() * 15;
          if (this.loadingProgress > 30 && this.loadingProgress < 50) {
            this.loadingMessage = `Analyzing ${this.selectedProduct.name}...`;
          } else if (this.loadingProgress > 60) {
            this.loadingMessage = `Generating ${this.recipeLanguage.toUpperCase()} recipe...`;
          }
        }
      }, 500);

      try {
        // ========== ERWEITERTE REQUEST MIT SPRACHE ==========
        const recipeRequest = {
          productId: this.selectedProduct.id,
          productName: this.selectedProduct.name,
          servings: this.servings,
          cuisine: this.cuisine,
          difficulty: this.difficulty,
          language: this.recipeLanguage, // ← NEU: Sprache mitschicken
          customInstructions: userMessage,
          dietaryRestrictions: this.getDietaryRestrictions()
        };

        console.log(`🌍 Generating ${this.recipeLanguage.toUpperCase()} recipe:`, recipeRequest);

        const response = await this.$store.dispatch('request', {
          method: 'POST',
          url: '/api/v1/recipes/generate-with-ai',
          data: recipeRequest
        });

        clearInterval(progressInterval);
        this.loadingProgress = 100;

        // Remove loading message
        this.messages = this.messages.filter(msg => msg.type !== 'loading');

        if (response.data && response.data.success) {
          const recipe = response.data.data;
          
          // Language-specific success message
          const languageMessages = {
            'de': `✨ Perfekt! Hier ist dein ${this.cuisine}-Rezept für "${this.selectedProduct.name}" auf Deutsch:`,
            'en': `✨ Perfect! Here's your ${this.cuisine} recipe for "${this.selectedProduct.name}" in English:`,
            'it': `✨ Perfetto! Ecco la tua ricetta ${this.cuisine} per "${this.selectedProduct.name}" in italiano:`,
            'fr': `✨ Parfait! Voici votre recette ${this.cuisine} pour "${this.selectedProduct.name}" en français:`
          };

          this.addMessage('ai', languageMessages[this.recipeLanguage] || languageMessages['de']);
          this.addMessage('recipe', '', recipe);
          
          console.log(`✅ ${this.recipeLanguage.toUpperCase()} recipe generated:`, recipe.name);
        } else {
          throw new Error(response.data?.message || 'Recipe generation failed');
        }

      } catch (error) {
        clearInterval(progressInterval);
        this.messages = this.messages.filter(msg => msg.type !== 'loading');
        
        console.error('Recipe generation error:', error);
        
        const errorMessages = {
          'de': '❌ Entschuldigung, beim Generieren des deutschen Rezepts ist ein Fehler aufgetreten. Bitte versuche es erneut.',
          'en': '❌ Sorry, an error occurred while generating the English recipe. Please try again.',
          'it': '❌ Scusa, si è verificato un errore durante la generazione della ricetta italiana. Riprova.',
          'fr': '❌ Désolé, une erreur s\'est produite lors de la génération de la recette française. Veuillez réessayer.'
        };

        this.addMessage('ai', errorMessages[this.recipeLanguage] || errorMessages['de']);
        this.$message.error('Error generating recipe: ' + (error.response?.data?.message || error.message));
      } finally {
        this.generating = false;
        clearInterval(progressInterval);
      }
    },

    // ========== ERWEITERTE saveRecipeToDatabase METHODE ==========
    async saveRecipeToDatabase(recipe) {
      try {
        // Verify product is selected
        if (!this.selectedProduct || !this.selectedProduct.id) {
          this.$message.error('Kein Produkt ausgewählt. Bitte wähle zuerst ein Produkt.')
          return
        }

        const languageConfirmMessages = {
          'de': `Möchtest du das deutsche Rezept für "${this.selectedProduct.name}" in der Datenbank speichern?`,
          'en': `Do you want to save the English recipe for "${this.selectedProduct.name}" to the database?`,
          'it': `Vuoi salvare la ricetta italiana per "${this.selectedProduct.name}" nel database?`,
          'fr': `Voulez-vous sauvegarder la recette française pour "${this.selectedProduct.name}" dans la base de données?`
        };

        await this.$confirm(
          languageConfirmMessages[this.recipeLanguage] || languageConfirmMessages['de'],
          'Rezept speichern',
          {
            confirmButtonText: 'Ja, speichern',
            cancelButtonText: 'Abbrechen',
            type: 'info'
          }
        )

        this.saving = true

        const recipeData = {
          productId: this.selectedProduct.id,
          name: recipe.name,
          description: recipe.description,
          servings: recipe.servings,
          prepTime: recipe.prepTime,
          cookTime: recipe.cookTime,
          difficulty: recipe.difficulty,
          cuisine: recipe.cuisine || this.cuisine,
          language: this.recipeLanguage, // ← NEU: Sprache mitschicken
          instructions: recipe.instructions,
          tags: recipe.tags || [],
          nutrition: recipe.nutrition || null,
          ingredients: recipe.ingredients.map(ing => ({
            name: ing.name,
            quantity: parseFloat(ing.quantity) || 0,
            unit: ing.unit || 'g',
            notes: ing.notes || ''
          }))
        }

        // Debug log
        console.log(`💾 Saving ${this.recipeLanguage.toUpperCase()} recipe:`, {
          ...recipeData,
          productId: this.selectedProduct.id,
          product_name: this.selectedProduct.name
        })

        // ========== ERWEITERTE STORE DISPATCH ==========
        await this.$store.dispatch('recipes/saveAIRecipe', recipeData)

        const successMessages = {
          'de': `Deutsches Rezept für "${this.selectedProduct.name}" erfolgreich gespeichert! 🎉`,
          'en': `English recipe for "${this.selectedProduct.name}" saved successfully! 🎉`,
          'it': `Ricetta italiana per "${this.selectedProduct.name}" salvata con successo! 🎉`,
          'fr': `Recette française pour "${this.selectedProduct.name}" sauvegardée avec succès! 🎉`
        };

        this.$message.success(successMessages[this.recipeLanguage] || successMessages['de']);

        const chatMessages = {
          'de': `✅ Das deutsche Rezept wurde für das Produkt "${this.selectedProduct.name}" gespeichert!`,
          'en': `✅ The English recipe has been saved for the product "${this.selectedProduct.name}"!`,
          'it': `✅ La ricetta italiana è stata salvata per il prodotto "${this.selectedProduct.name}"!`,
          'fr': `✅ La recette française a été sauvegardée pour le produit "${this.selectedProduct.name}"!`
        };

        this.addMessage('ai', chatMessages[this.recipeLanguage] || chatMessages['de']);

      } catch (error) {
        if (error !== 'cancel') {
          console.error('Save Error:', error)
          console.error('Error details:', error.response?.data)
          
          if (error.response?.status === 404) {
            this.$message.error(`Produkt mit ID ${this.selectedProduct?.id} nicht gefunden`)
          } else {
            const errorMessages = {
              'de': 'Fehler beim Speichern des deutschen Rezepts',
              'en': 'Error saving English recipe',
              'it': 'Errore nel salvare la ricetta italiana',
              'fr': 'Erreur lors de la sauvegarde de la recette française'
            };
            this.$message.error(errorMessages[this.recipeLanguage] || errorMessages['de']);
          }
        }
      } finally {
        this.saving = false
      }
    },

    // ========== HILFSMETHODEN FÜR SPRACHEN ==========
    getDietaryRestrictions() {
      // Extract dietary restrictions from user input
      const restrictions = [];
      const input = this.userInput.toLowerCase();
      
      if (input.includes('vegetarisch') || input.includes('vegetarian')) restrictions.push('vegetarian');
      if (input.includes('vegan')) restrictions.push('vegan');
      if (input.includes('glutenfrei') || input.includes('gluten-free')) restrictions.push('gluten-free');
      if (input.includes('laktosefrei') || input.includes('lactose-free')) restrictions.push('lactose-free');
      
      return restrictions;
    },

    getRandomLoadingMessage() {
      const messages = {
        'de': [
          'Analysiere Zutaten...',
          'Suche nach perfekten Kombinationen...',
          'Erstelle authentisches Rezept...',
          'Optimiere Portionsgrößen...'
        ],
        'en': [
          'Analyzing ingredients...',
          'Finding perfect combinations...',
          'Creating authentic recipe...',
          'Optimizing portion sizes...'
        ],
        'it': [
          'Analizzando gli ingredienti...',
          'Trovando combinazioni perfette...',
          'Creando ricetta autentica...',
          'Ottimizzando le porzioni...'
        ],
        'fr': [
          'Analyse des ingrédients...',
          'Recherche de combinaisons parfaites...',
          'Création de recette authentique...',
          'Optimisation des portions...'
        ]
      };

      const languageMessages = messages[this.recipeLanguage] || messages['de'];
      return languageMessages[Math.floor(Math.random() * languageMessages.length)];
    },

    // ========== QUICKSTART ERWEITERN ==========
    async quickStart(type) {
      if (type === 'auto') {
        const welcomeMessages = {
          'de': `Lass mich ein perfektes deutsches Rezept für "${this.selectedProduct.name}" erstellen...`,
          'en': `Let me create a perfect English recipe for "${this.selectedProduct.name}"...`,
          'it': `Lascia che crei una ricetta italiana perfetta per "${this.selectedProduct.name}"...`,
          'fr': `Laissez-moi créer une recette française parfaite pour "${this.selectedProduct.name}"...`
        };

        this.addMessage('ai', welcomeMessages[this.recipeLanguage] || welcomeMessages['de']);
        await this.sendMessage();
      } else {
        const customMessages = {
          'de': `Gerne! Teile mir mit, wie du das ${this.selectedProduct.name}-Rezept anpassen möchtest. Zum Beispiel: "vegetarisch", "scharf", "für Kinder", etc.`,
          'en': `Sure! Tell me how you'd like to customize the ${this.selectedProduct.name} recipe. For example: "vegetarian", "spicy", "for kids", etc.`,
          'it': `Certo! Dimmi come vorresti personalizzare la ricetta per ${this.selectedProduct.name}. Ad esempio: "vegetariana", "piccante", "per bambini", ecc.`,
          'fr': `Bien sûr! Dites-moi comment vous aimeriez personnaliser la recette de ${this.selectedProduct.name}. Par exemple: "végétarienne", "épicée", "pour enfants", etc.`
        };

        this.addMessage('ai', customMessages[this.recipeLanguage] || customMessages['de']);
      }
    },

    // ... alle anderen bestehenden Methoden bleiben unverändert ...
  }
}
</script>

<!-- 
TEIL 3: CSS ERWEITERN (Optional)

Füge diese CSS-Regeln hinzu für besseres Language Dropdown Styling:
-->

<style scoped>
/* ... alle deine bestehenden Styles ... */

/* Language selector special styling */
.advanced-options .el-select {
  margin-right: 8px;
}

.advanced-options .el-select:last-child {
  margin-right: 0;
}

/* Language option flags */
.el-select-dropdown__item {
  display: flex;
  align-items: center;
}

/* Mobile responsive */
@media (max-width: 768px) {
  .advanced-options {
    flex-direction: column;
    gap: 8px;
  }
  
  .advanced-options .el-select {
    width: 100% !important;
    margin-right: 0;
  }
}
</style>

<!--
========== ZUSAMMENFASSUNG DER ÄNDERUNGEN ==========

1. NEU: recipeLanguage: 'de' in data()
2. NEU: Language Dropdown in Advanced Options  
3. ERWEITERT: sendMessage() mit language parameter
4. ERWEITERT: saveRecipeToDatabase() mit language parameter
5. NEU: Mehrsprachige UI Messages
6. NEU: getDietaryRestrictions() Hilfsfunktion
7. NEU: getRandomLoadingMessage() mit Sprachen
8. ERWEITERT: quickStart() mit mehrsprachigen Messages

========== VERWENDUNG ==========

1. Kopiere die Scripts (Service + Controller)
2. Erweitere deine AIRecipeChat.vue mit den obigen Änderungen
3. Server neu starten
4. Teste verschiedene Sprachen!

==================================================
-->