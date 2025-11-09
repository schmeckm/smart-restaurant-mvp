import request from '@/utils/request'

export default {
  namespaced: true,

  state: () => ({
    forecast: {
      avgCustomers: 0,
      confidence: 0,
      weeklyData: [],
      influenceFactors: []
    },
    loading: false
  }),

  mutations: {
    SET_FORECAST(state, payload) {
      state.forecast = payload
    },
    SET_LOADING(state, value) {
      state.loading = value
    }
  },

  actions: {
    async fetchForecast({ commit }) {
      commit('SET_LOADING', true)
      try {
        const res = await request({
          url: '/ai/forecast',
          method: 'get',
          params: { includeWeather: true }
        })

        // 🧩 Hier der Log: Zeigt das rohe Backend-Response im Browser-DevTools
        console.log('📊 Raw Forecast API Response:', res.data)

        if (res.success && res.data) {
          const d = res.data

          // 🔧 Mappe Backend-Struktur → Frontend-Erwartung
          commit('SET_FORECAST', {
            avgCustomers: d.avgCustomers || d.expectedCustomers || 0,
            confidence: d.confidence || 0,
            weeklyData: d.weeklyData || [],
            influenceFactors: d.influenceFactors || d.influences || [],
            summary: d.summary || '',
            recommendations: d.recommendations || []
          })
        } else {
          console.warn('⚠️ Keine Forecast-Daten empfangen:', res)
        }
      } catch (error) {
        console.error('❌ Fehler beim Laden des Forecasts:', error)
        throw error
      } finally {
        commit('SET_LOADING', false)
      }
    }
  },

  getters: {
    forecastData: (state) => state.forecast,
    forecastLoading: (state) => state.loading
  }
}
