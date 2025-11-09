<template>
  <el-card shadow="hover" class="week-selector-card">
    <template #header>
      <div class="card-header">
        <el-icon><Calendar /></el-icon>
        <span>📅 Woche auswählen</span>
      </div>
    </template>

    <div class="week-selector-body">
      <el-date-picker
        v-model="selectedWeek"
        type="week"
        format="[Woche] ww, yyyy"
        placeholder="Woche auswählen"
        style="width: 100%;"
        @change="emitWeekChange"
      />
    </div>
  </el-card>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Calendar } from '@element-plus/icons-vue'

// Props (optional initial week from parent)
const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['update:modelValue', 'week-change'])

// State
const selectedWeek = ref(props.modelValue)

// Watch for external changes
watch(
  () => props.modelValue,
  (newVal) => {
    if (newVal !== selectedWeek.value) {
      selectedWeek.value = newVal
    }
  }
)

// Emit when user selects a new week
function emitWeekChange(val) {
  emit('update:modelValue', val)
  emit('week-change', val)
}
</script>

<style scoped>
.week-selector-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  font-size: 15px;
}

.week-selector-body {
  padding: 10px 0;
}
</style>
