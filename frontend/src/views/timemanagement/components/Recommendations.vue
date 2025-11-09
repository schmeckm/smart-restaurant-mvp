<template>
  <el-card class="recommendations-section" shadow="hover">
    <template #header>
      <h2>💡 KI-Empfehlungen & Hinweise</h2>
    </template>

    <div v-if="forecast.length > 0">
      <ul>
        <li v-for="item in forecast" :key="item.day">
          📈 {{ item.day }} – Erwartete Nachfrage: {{ item.demand }}
        </li>
      </ul>
    </div>
    <div v-else>
      <p>Keine Vorhersagen verfügbar.</p>
    </div>
  </el-card>
</template>

<script setup>
defineProps({
  forecast: {
    type: Array,
    default: () => []
  }
})
</script>

<style scoped>
.recommendations-section {
  margin-top: 1rem;
}
ul {
  padding-left: 1.5rem;
}
</style>
