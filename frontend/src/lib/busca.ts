/** Minúsculas e sem acentos, para comparar o que se digita na busca ("José" acha "jose"). */
export function normalizarBusca(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}

/**
 * Classes do `Input` para os campos de busca com ícone à esquerda (o `ComboboxInput` do reka-ui
 * não usa o componente `Input`).
 */
export const CLASSES_DO_CAMPO_DE_BUSCA =
  'border-input placeholder:text-muted-foreground dark:bg-input/30 h-9 w-full min-w-0 rounded-md border bg-transparent py-1 pr-3 pl-9 text-base shadow-xs transition-[color,box-shadow] outline-none md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-3 aria-invalid:border-destructive aria-invalid:ring-destructive/20'
