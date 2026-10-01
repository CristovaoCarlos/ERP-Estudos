import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import { defineConfigWithVueTs, vueTsConfigs } from '@vue/eslint-config-typescript'
import pluginVue from 'eslint-plugin-vue'
import { globalIgnores } from 'eslint/config'
import globals from 'globals'

export default defineConfigWithVueTs(
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,vue}'],
    languageOptions: { ecmaVersion: 2023, globals: globals.browser },
  },
  pluginVue.configs['flat/recommended'],
  vueTsConfigs.recommended,
  {
    // Nomes de tela e de componente em português, de uma palavra (Login, Listagem, Tela).
    rules: { 'vue/multi-word-component-names': 'off' },
  },
  {
    // Código gerado pelo CLI do shadcn-vue: props opcionais sem valor padrão.
    files: ['src/components/ui/**/*.vue'],
    rules: { 'vue/require-default-prop': 'off' },
  },
  skipFormatting,
)
