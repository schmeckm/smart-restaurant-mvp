<template>
  <el-dialog
    v-model="visible"
    title="🕓 Schicht bearbeiten"
    width="500px"
    destroy-on-close
  >
    <el-form :model="form" label-width="120px">
      <el-form-item label="Mitarbeiter">
        <el-input v-model="form.name" disabled />
      </el-form-item>

      <el-form-item label="Datum">
        <el-date-picker v-model="form.date" type="date" placeholder="Datum wählen" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Startzeit">
        <el-time-picker v-model="form.start" placeholder="Start" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Endzeit">
        <el-time-picker v-model="form.end" placeholder="Ende" style="width: 100%" />
      </el-form-item>

      <el-form-item label="Rolle">
        <el-select v-model="form.role" placeholder="Rolle wählen" style="width: 100%">
          <el-option label="Koch" value="Koch" />
          <el-option label="Kellner" value="Kellner" />
          <el-option label="Barista" value="Barista" />
          <el-option label="Service" value="Service" />
        </el-select>
      </el-form-item>

      <el-form-item label="Notiz">
        <el-input
          v-model="form.note"
          type="textarea"
          :rows="2"
          placeholder="Optionale Notiz zur Schicht"
        />
      </el-form-item>
    </el-form>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="emit('close')">Abbrechen</el-button>
        <el-button type="primary" @click="saveShift">💾 Speichern</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  shift: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['save', 'close'])

const visible = ref(true)
const form = ref({
  name: '',
  date: '',
  start: '',
  end: '',
  role: '',
  note: ''
})

// ⏱️ Wenn Props geändert → Formular updaten
watch(
  () => props.shift,
  (val) => {
    if (val) form.value = { ...val }
  },
  { immediate: true }
)

// 💾 Schicht speichern
function saveShift() {
  emit('save', form.value)
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
