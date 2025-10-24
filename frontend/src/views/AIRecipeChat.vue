<template>
  <div class="ai-recipe-chat">
    <div class="page-header">
      <h1>🤖 AI Rezept-Generator</h1>
      <p class="subtitle">Erstelle professionelle Restaurant-Rezepte mit KI</p>
    </div>

    <!-- Product Selection (if not pre-selected) -->
    <div v-if="!selectedProduct && messages.length === 0" class="product-selection">
      <el-card>
        <h3>Für welches Produkt möchtest du ein Rezept erstellen?</h3>
        <el-select 
          v-model="selectedProductId" 
          placeholder="Produkt wählen"
          filterable
          size="large"
          style="width: 100%; max-width: 500px; margin-top: 16px;"
          @change="handleProductSelect"
        >
          <el-option
            v-for="product in availableProducts"
            :key="product.id"
            :label="`${product.name} - ${product.category}`"
            :value="product.id"
          >
            <div style="display: flex; justify-content: space-between;">
              <span>{{ product.name }}</span>
              <span style="color: #8492a6; font-size: 13px">{{ product.category }}</span>
            </div>
          </el-option>
        </el-select>
      </el-card>
    </div>

    <!-- Selected Product Info -->
    <el-card v-if="selectedProduct" class="selected-product-card">
      <div class="product-info-header">
        <div>
          <h3>📦 Ausgewähltes Produkt</h3>
          <p class="product-name">{{ selectedProduct.name }}</p>
          <el-tag size="small">{{ selectedProduct.category }}</el-tag>
        </div>
        <el-button @click="changeProduct" type="info" plain>
          Produkt wechseln
        </el-button>
      </div>
    </el-card>

    <!-- Chat Container -->
    <div v-if="selectedProduct" class="chat-container">
      <!-- Messages Area -->
      <div class="messages-area" ref="messagesArea">
        <div v-for="(message, index) in messages" :key="index" :class="['message', message.type]">
          <!-- User Message -->
          <div v-if="message.type === 'user'" class="message-content user-message">
            <div class="message-bubble">
              <p>{{ message.text }}</p>
            </div>
            <div class="message-avatar">👤</div>
          </div>

          <!-- AI Message -->
          <div v-else-if="message.type === 'ai'" class="message-content ai-message">
            <div class="message-avatar">🤖</div>
            <div class="message-bubble">
              <p>{{ message.text }}</p>
            </div>
          </div>

          <!-- Recipe Card -->
          <div v-else-if="message.type === 'recipe'" class="recipe-card">
            <div class="recipe-header">
              <h3>{{ message.recipe.name }}</h3>
              <el-tag :type="getDifficultyType(message.recipe.difficulty)">
                {{ message.recipe.difficulty }}
              </el-tag>
            </div>

            <p class="recipe-description">{{ message.recipe.description }}</p>

            <div class="recipe-meta">
              <div class="meta-item">
                <el-icon><Clock /></el-icon>
                <span>Vorbereitung: {{ message.recipe.prepTime }} Min</span>
              </div>
              <div class="meta-item">
                <el-icon><Timer /></el-icon>
                <span>Kochzeit: {{ message.recipe.cookTime }} Min</span>
              </div>
              <div class="meta-item">
                <el-icon><User /></el-icon>
                <span>{{ message.recipe.servings }} Portionen</span>
              </div>
            </div>

            <!-- Ingredients -->
            <div class="recipe-section">
              <h4>Zutaten</h4>
              <div class="ingredients-list">
                <div v-for="(ing, idx) in message.recipe.ingredients" :key="idx" class="ingredient-item">
                  <el-icon><Check /></el-icon>
                  <span>{{ ing.quantity }} {{ ing.unit }} {{ ing.name }}</span>
                  <span v-if="ing.notes" class="ingredient-notes">({{ ing.notes }})</span>
                </div>
              </div>
            </div>

            <!-- Instructions -->
            <div class="recipe-section">
              <h4>Zubereitung</h4>
              <ol class="instructions-list">
                <li v-for="(step, idx) in message.recipe.instructions" :key="idx">
                  {{ step }}
                </li>
              </ol>
            </div>

            <!-- Nutrition -->
            <div v-if="message.recipe.nutrition" class="recipe-section nutrition">
              <h4>Nährwerte (pro Portion)</h4>
              <div class="nutrition-grid">
                <div class="nutrition-item">
                  <span class="label">Kalorien</span>
                  <span class="value">{{ message.recipe.nutrition.calories }} kcal</span>
                </div>
                <div class="nutrition-item">
                  <span class="label">Protein</span>
                  <span class="value">{{ message.recipe.nutrition.protein }} g</span>
                </div>
                <div class="nutrition-item">
                  <span class="label">Kohlenhydrate</span>
                  <span class="value">{{ message.recipe.nutrition.carbs }} g</span>
                </div>
                <div class="nutrition-item">
                  <span class="label">Fett</span>
                  <span class="value">{{ message.recipe.nutrition.fat }} g</span>
                </div>
              </div>
            </div>

            <!-- Tags -->
            <div v-if="message.recipe.tags" class="recipe-tags">
              <el-tag v-for="tag in message.recipe.tags" :key="tag" size="small">
                {{ tag }}
              </el-tag>
            </div>

            <!-- Action Buttons -->
            <div class="recipe-actions">
              <el-button type="primary" @click="saveRecipeToDatabase(message.recipe)" :loading="saving">
                <el-icon><DocumentAdd /></el-icon>
                Für "{{ selectedProduct.name }}" speichern
              </el-button>
              <el-button @click="regenerateRecipe">
                <el-icon><Refresh /></el-icon>
                Neu generieren
              </el-button>
              <el-button @click="editRecipe(message.recipe)">
                <el-icon><Edit /></el-icon>
                Bearbeiten
              </el-button>
            </div>
          </div>

          <!-- Loading with Progress -->
          <div v-else-if="message.type === 'loading'" class="message-content ai-message">
            <div class="message-avatar">🤖</div>
            <div class="message-bubble loading-bubble">
              <div class="loading-content">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p class="loading-text">{{ loadingMessage }}</p>
                <el-progress 
                  :percentage="loadingProgress" 
                  :show-text="false"
                  :stroke-width="4"
                  color="#409eff"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div v-if="messages.length === 0" class="quick-actions">
        <h3>Wie soll ich das Rezept generieren?</h3>
        <div class="action-cards">
          <div class="action-card" @click="quickStart('auto')">
            <div class="emoji">✨</div>
            <span>Automatisch generieren</span>
            <p>Basierend auf "{{ selectedProduct.name }}"</p>
          </div>
          <div class="action-card" @click="quickStart('custom')">
            <div class="emoji">✏️</div>
            <span>Eigene Vorgaben</span>
            <p>Küche, Portionen, Schwierigkeit anpassen</p>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="input-area">
        <div class="input-container">
          <el-input
            v-model="userInput"
            placeholder="Optional: Spezielle Anweisungen (z.B. 'vegetarisch', 'scharf', 'für Kinder')"
            @keyup.enter="sendMessage"
            :disabled="generating"
            size="large"
          >
            <template #prepend>
              <el-select v-model="servings" style="width: 100px">
                <el-option label="1 Portion" :value="1" />
                <el-option label="2 Portionen" :value="2" />
                <el-option label="4 Portionen" :value="4" />
                <el-option label="6 Portionen" :value="6" />
                <el-option label="8 Portionen" :value="8" />
              </el-select>
            </template>
            <template #append>
              <el-button @click="sendMessage" :loading="generating" type="primary">
                <el-icon><Promotion /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>

        <!-- Advanced Options -->
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

          <el-button size="small" @click="clearChat" :disabled="messages.length === 0">
            <el-icon><Delete /></el-icon>
            Chat löschen
          </el-button>
        </div>
      </div>
    </div>

    <!-- Edit Recipe Dialog -->
    <el-dialog v-model="showEditDialog" title="Rezept bearbeiten" width="70%">
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="Name">
          <el-input v-model="editForm.name" />
        </el-form-item>
        <el-form-item label="Beschreibung">
          <el-input v-model="editForm.description" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="Portionen">
          <el-input-number v-model="editForm.servings" :min="1" />
        </el-form-item>
        
        <el-divider>Zutaten</el-divider>
        <div v-for="(ing, idx) in editForm.ingredients" :key="idx" class="ingredient-edit">
          <el-input v-model="ing.name" placeholder="Zutat" style="width: 30%" />
          <el-input-number v-model="ing.quantity" :min="0" style="width: 20%" />
          <el-input v-model="ing.unit" placeholder="Einheit" style="width: 15%" />
          <el-input v-model="ing.notes" placeholder="Hinweise" style="width: 25%" />
          <el-button type="danger" @click="removeIngredient(idx)" circle>
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
        <el-button @click="addIngredient" size="small">+ Zutat hinzufügen</el-button>
      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false">Abbrechen</el-button>
        <el-button type="primary" @click="saveEditedRecipe">Speichern</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useStore } from 'vuex'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Clock, Timer, User, Check, DocumentAdd, Refresh, Edit, Delete, Promotion 
} from '@element-plus/icons-vue'
import axios from 'axios'

export default {
  name: 'AIRecipeChat',
  components: {
    Clock, Timer, User, Check, DocumentAdd, Refresh, Edit, Delete, Promotion
  },
  setup() {
    const store = useStore()
    const route = useRoute()
    
    const messages = ref([])
    const userInput = ref('')
    const generating = ref(false)
    const saving = ref(false)
    const servings = ref(4)
    const cuisine = ref('International')
    const difficulty = ref('Mittel')
    const messagesArea = ref(null)
    const showEditDialog = ref(false)
    const selectedProductId = ref(null)
    const selectedProduct = ref(null)
    const loadingMessage = ref('KI denkt nach...')
    const loadingProgress = ref(0)
    
    let progressInterval = null
    
    const editForm = reactive({
      name: '',
      description: '',
      servings: 4,
      ingredients: []
    })
    const currentRecipe = ref(null)

    const availableProducts = computed(() => {
      return store.getters['products/products'] || []
    })

    // Create axios instance with longer timeout for AI generation
    const aiRequest = axios.create({
      baseURL: process.env.VUE_APP_API_URL || 'http://localhost:3000/api/v1',
      timeout: 90000, // 90 seconds for AI generation
      headers: {
        'Content-Type': 'application/json'
      }
    })

    // Add token to requests if available
    aiRequest.interceptors.request.use(config => {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })

onMounted(async () => {
  // Load products
  await store.dispatch('products/fetchProducts', { limit: 100 })
  
  // Check if product_id was passed via route query
  if (route.query.product_id) {
    selectedProductId.value = route.query.product_id  // ← String behalten!
    
    // Warte bis Products geladen sind
    await nextTick()
    
    handleProductSelect(selectedProductId.value)
    
    console.log('🎯 Product pre-selected from route:', selectedProductId.value)
  }
})

    onBeforeUnmount(() => {
      if (progressInterval) {
        clearInterval(progressInterval)
      }
    })

    const handleProductSelect = (productId) => {
      const product = availableProducts.value.find(p => p.id === productId)
      if (product) {
        selectedProduct.value = product
        addMessage('ai', `Perfekt! Ich erstelle ein Rezept für "${product.name}". 

Möchtest du automatisch starten oder eigene Vorgaben machen?`)
      }
    }

    const changeProduct = () => {
      selectedProduct.value = null
      selectedProductId.value = null
      messages.value = []
    }

    const quickStart = (type) => {
      if (type === 'auto') {
        userInput.value = ''
        sendMessage()
      } else {
        addMessage('ai', 'Nutze die Optionen unten, um Portionen, Küche und Schwierigkeit anzupassen. Dann klicke auf den Senden-Button! ✨')
      }
    }

    const scrollToBottom = () => {
      nextTick(() => {
        if (messagesArea.value) {
          messagesArea.value.scrollTop = messagesArea.value.scrollHeight
        }
      })
    }

    const addMessage = (type, text, recipe = null) => {
      messages.value.push({ type, text, recipe })
      scrollToBottom()
    }

    const startLoadingProgress = () => {
      loadingProgress.value = 0
      loadingMessage.value = '🤖 KI analysiert deine Anfrage...'
      
      // Simulate progress with messages
      const messages = [
        { progress: 20, text: '📝 Rezeptstruktur wird erstellt...' },
        { progress: 40, text: '🥗 Zutaten werden zusammengestellt...' },
        { progress: 60, text: '👨‍🍳 Zubereitungsschritte werden generiert...' },
        { progress: 80, text: '🔬 Nährwerte werden berechnet...' },
        { progress: 95, text: '✨ Finalisierung läuft...' }
      ]
      
      let messageIndex = 0
      let smoothProgress = 0
      
      progressInterval = setInterval(() => {
        // Smooth progress increment
        smoothProgress += 0.5
        loadingProgress.value = Math.min(smoothProgress, 95)
        
        // Update message based on progress
        const currentMessage = messages.find(m => 
          smoothProgress >= m.progress - 5 && smoothProgress < m.progress + 5
        )
        
        if (currentMessage && currentMessage.text !== loadingMessage.value) {
          loadingMessage.value = currentMessage.text
        }
      }, 200)
    }

    const stopLoadingProgress = () => {
      if (progressInterval) {
        clearInterval(progressInterval)
        progressInterval = null
      }
      loadingProgress.value = 100
      loadingMessage.value = '✅ Fertig!'
    }

    const sendMessage = async () => {
      if (!selectedProduct.value) {
        ElMessage.warning('Bitte wähle zuerst ein Produkt aus')
        return
      }

      const productName = selectedProduct.value.name
      const additionalInfo = userInput.value.trim()
      
      let userMessage = `Erstelle ein Rezept für ${productName} (${servings.value} Portionen, ${cuisine.value}, ${difficulty.value})`
      if (additionalInfo) {
        userMessage += ` - ${additionalInfo}`
      }
      addMessage('user', userMessage)
      
      userInput.value = ''
      addMessage('loading', '')
      generating.value = true
      startLoadingProgress()

      try {
        const response = await aiRequest.post('/recipes/generate-with-ai', {
          productName: productName + (additionalInfo ? ` (${additionalInfo})` : ''),
          servings: servings.value,
          cuisine: cuisine.value,
          difficulty: difficulty.value
        })

        stopLoadingProgress()
        
        // Small delay to show completion
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Remove loading message
        messages.value.pop()

        if (response.data.success) {
          const recipe = response.data.data
          addMessage('ai', 'Ich habe ein tolles Rezept für dich erstellt! 🎉')
          addMessage('recipe', '', recipe)
        } else {
          addMessage('ai', 'Es gab einen Fehler bei der Generierung. Bitte versuche es erneut.')
        }

      } catch (error) {
        stopLoadingProgress()
        messages.value.pop()
        
        console.error('Generation Error:', error)
        
        // Handle different error types
        if (error.code === 'ECONNABORTED') {
          addMessage('ai', '⏱️ Die Anfrage dauert zu lange. Das Backend braucht mehr Zeit zum Antworten. Bitte versuche es in einem Moment erneut.')
          ElMessage.error({
            message: 'Zeitüberschreitung - KI-Generation dauert zu lange',
            duration: 5000
          })
        } else if (error.response?.status === 504) {
          addMessage('ai', '🕐 Gateway Timeout - Der Server braucht zu lange zum Antworten. Bitte prüfe die Backend-Konfiguration.')
          ElMessage.error({
            message: 'Backend Timeout - Server antwortet nicht rechtzeitig',
            duration: 5000
          })
        } else if (error.response?.status === 500) {
          addMessage('ai', '❌ Server-Fehler. Stelle sicher, dass ANTHROPIC_API_KEY oder OPENAI_API_KEY korrekt konfiguriert ist.')
          ElMessage.error({
            message: 'Server-Fehler - Prüfe API-Konfiguration',
            duration: 5000
          })
        } else if (error.response?.data?.message) {
          addMessage('ai', `❌ ${error.response.data.message}`)
          ElMessage.error(error.response.data.message)
        } else {
          addMessage('ai', '❌ Unerwarteter Fehler bei der Generierung. Bitte versuche es erneut.')
          ElMessage.error('Fehler bei der KI-Generierung')
        }
      } finally {
        generating.value = false
        if (progressInterval) {
          clearInterval(progressInterval)
          progressInterval = null
        }
      }
    }

    const saveRecipeToDatabase = async (recipe) => {
      try {
        // Verify product is selected
        if (!selectedProduct.value || !selectedProduct.value.id) {
          ElMessage.error('Kein Produkt ausgewählt. Bitte wähle zuerst ein Produkt.')
          return
        }

        await ElMessageBox.confirm(
          `Möchtest du das Rezept für "${selectedProduct.value.name}" in der Datenbank speichern?`,
          'Rezept speichern',
          {
            confirmButtonText: 'Ja, speichern',
            cancelButtonText: 'Abbrechen',
            type: 'info'
          }
        )

        saving.value = true

        const recipeData = {
          name: recipe.name,
          description: recipe.description,
          servings: recipe.servings,
          prep_time: recipe.prepTime,
          cook_time: recipe.cookTime,
          difficulty: recipe.difficulty,
          cuisine: recipe.cuisine || 'International',
          instructions: recipe.instructions,
          tags: recipe.tags || [],
          nutrition: recipe.nutrition || null,
          product_id: selectedProduct.value.id,
          ingredients: recipe.ingredients.map(ing => ({
            name: ing.name,
            quantity: parseFloat(ing.quantity) || 0,
            unit: ing.unit || 'g',
            notes: ing.notes || ''
          }))
        }

        // Debug log
        console.log('💾 Saving recipe with data:', {
          ...recipeData,
          product_id: selectedProduct.value.id,
          product_name: selectedProduct.value.name
        })

        await store.dispatch('recipes/createRecipe', recipeData)

        ElMessage.success(`Rezept für "${selectedProduct.value.name}" erfolgreich gespeichert! 🎉`)
        addMessage('ai', `✅ Rezept wurde für das Produkt "${selectedProduct.value.name}" gespeichert!`)

      } catch (error) {
        if (error !== 'cancel') {
          console.error('Save Error:', error)
          console.error('Error details:', error.response?.data)
          
          if (error.response?.status === 404) {
            ElMessage.error(`Produkt mit ID ${selectedProduct.value?.id} nicht gefunden`)
          } else {
            ElMessage.error('Fehler beim Speichern des Rezepts')
          }
        }
      } finally {
        saving.value = false
      }
    }

    const regenerateRecipe = () => {
      sendMessage()
    }

    const editRecipe = (recipe) => {
      currentRecipe.value = recipe
      editForm.name = recipe.name
      editForm.description = recipe.description
      editForm.servings = recipe.servings
      editForm.ingredients = JSON.parse(JSON.stringify(recipe.ingredients))
      showEditDialog.value = true
    }

    const addIngredient = () => {
      editForm.ingredients.push({
        name: '',
        quantity: 0,
        unit: 'g',
        notes: ''
      })
    }

    const removeIngredient = (index) => {
      editForm.ingredients.splice(index, 1)
    }

    const saveEditedRecipe = async () => {
      currentRecipe.value.name = editForm.name
      currentRecipe.value.description = editForm.description
      currentRecipe.value.servings = editForm.servings
      currentRecipe.value.ingredients = editForm.ingredients
      
      showEditDialog.value = false
      ElMessage.success('Änderungen übernommen')
    }

    const clearChat = () => {
      messages.value = []
    }

    const getDifficultyType = (difficulty) => {
      const types = {
        'Einfach': 'success',
        'Mittel': 'warning',
        'Schwer': 'danger'
      }
      return types[difficulty] || 'info'
    }

    return {
      messages,
      userInput,
      generating,
      saving,
      servings,
      cuisine,
      difficulty,
      messagesArea,
      showEditDialog,
      editForm,
      selectedProductId,
      selectedProduct,
      availableProducts,
      loadingMessage,
      loadingProgress,
      handleProductSelect,
      changeProduct,
      quickStart,
      sendMessage,
      saveRecipeToDatabase,
      regenerateRecipe,
      editRecipe,
      addIngredient,
      removeIngredient,
      saveEditedRecipe,
      clearChat,
      getDifficultyType
    }
  }
}
</script>

<style scoped>
.ai-recipe-chat {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  text-align: center;
  margin-bottom: 30px;
}

.page-header h1 {
  margin: 0;
  font-size: 32px;
  color: #333;
}

.subtitle {
  color: #666;
  margin-top: 8px;
}

.product-selection {
  margin-bottom: 30px;
}

.product-selection h3 {
  margin: 0 0 16px 0;
  color: #333;
  font-size: 18px;
}

.selected-product-card {
  margin-bottom: 20px;
}

.product-info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-info-header h3 {
  margin: 0 0 8px 0;
  color: #666;
  font-size: 14px;
  font-weight: normal;
}

.product-name {
  font-size: 24px;
  font-weight: bold;
  color: #333;
  margin: 4px 0 8px 0;
}

.chat-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 350px);
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message {
  display: flex;
  flex-direction: column;
}

.message-content {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.user-message {
  flex-direction: row-reverse;
  justify-content: flex-start;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  flex-shrink: 0;
}

.message-bubble {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  word-wrap: break-word;
}

.user-message .message-bubble {
  background: #409eff;
  color: white;
}

.ai-message .message-bubble {
  background: #f4f4f5;
  color: #333;
}

.message-bubble p {
  margin: 0;
  white-space: pre-line;
}

.loading-bubble {
  padding: 20px;
  min-width: 300px;
}

.loading-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.loading-text {
  font-size: 13px;
  color: #666;
  margin: 0;
}

.typing-indicator {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;
}

.typing-indicator span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #409eff;
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
  }
  30% {
    transform: translateY(-10px);
  }
}

.recipe-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  padding: 24px;
  color: white;
  margin: 8px 0;
}

.recipe-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.recipe-header h3 {
  margin: 0;
  font-size: 24px;
}

.recipe-description {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 20px;
}

.recipe-meta {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.recipe-section {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.recipe-section h4 {
  margin: 0 0 12px 0;
  font-size: 18px;
}

.ingredients-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ingredient-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.ingredient-notes {
  opacity: 0.7;
  font-style: italic;
}

.instructions-list {
  padding-left: 20px;
  margin: 0;
}

.instructions-list li {
  margin-bottom: 8px;
  line-height: 1.6;
}

.nutrition {
  background: rgba(255, 255, 255, 0.15);
}

.nutrition-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 12px;
}

.nutrition-item {
  text-align: center;
}

.nutrition-item .label {
  display: block;
  font-size: 12px;
  opacity: 0.8;
  margin-bottom: 4px;
}

.nutrition-item .value {
  display: block;
  font-size: 18px;
  font-weight: bold;
}

.recipe-tags {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 16px;
}

.recipe-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.recipe-actions .el-button {
  background: white;
  color: #667eea;
  border: none;
}

.recipe-actions .el-button:hover {
  background: rgba(255, 255, 255, 0.9);
}

.quick-actions {
  padding: 40px 20px;
  text-align: center;
}

.quick-actions h3 {
  color: #666;
  margin-bottom: 24px;
}

.action-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  max-width: 600px;
  margin: 0 auto;
}

.action-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 24px;
  border-radius: 12px;
  cursor: pointer;
  transition: transform 0.2s;
  color: white;
}

.action-card:hover {
  transform: translateY(-4px);
}

.action-card .emoji {
  font-size: 48px;
  margin-bottom: 12px;
}

.action-card span {
  display: block;
  font-weight: 600;
  font-size: 16px;
  margin-bottom: 8px;
}

.action-card p {
  font-size: 13px;
  opacity: 0.9;
  margin: 0;
}

.input-area {
  padding: 20px;
  background: #f8f9fa;
  border-top: 1px solid #e0e0e0;
}

.input-container {
  margin-bottom: 12px;
}

.advanced-options {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.ingredient-edit {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}
</style>