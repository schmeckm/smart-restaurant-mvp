import { createI18n } from 'vue-i18n'
import de from './locales/de.json'
import en from './locales/en.json'
import fr from './locales/fr.json'
import it from './locales/it.json'

const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('userLanguage') || 'de',
  fallbackLocale: 'de',
  messages: {
    de,
    en,
    fr,
    it
  }
})

export default i18n