import { ref, type Component, type Ref } from 'vue'

/**
 * Coluna da `Listagem`. O texto da célula vem de `valor`; conteúdo rico (badges, botões) vem do
 * slot `#coluna-<id>` da tela, que recebe `{ item }`.
 */
export type Coluna<T> = {
  id: string
  titulo: string
  /** Classes da célula e do cabeçalho (alinhamento, largura). */
  className?: string
  /** Não aparece no menu Colunas nem pode ser escondida (ex.: Ações). */
  fixa?: boolean
  /** Começa desmarcada no menu Colunas. */
  ocultaPorPadrao?: boolean
  /** Texto da célula quando a tela não usa o slot da coluna. */
  valor?: (item: T) => string | number | null | undefined
  /** Texto considerado na busca rápida. Sem isso, a coluna não é pesquisada. */
  busca?: (item: T) => string | null | undefined
}

/** Aviso da listagem sem registros (sem busca ativa). */
export type ListagemVazia = { titulo: string; descricao: string; icone: Component }

/** Valores marcados num filtro da listagem (ex.: situações, UFs). */
export function useSelecao<V>() {
  const selecionados = ref<V[]>([]) as Ref<V[]>

  const alternar = (valor: V, marcado: boolean) => {
    selecionados.value = marcado
      ? [...selecionados.value, valor]
      : selecionados.value.filter((atual) => atual !== valor)
  }

  const limpar = () => {
    selecionados.value = []
  }

  return { selecionados, alternar, limpar }
}
