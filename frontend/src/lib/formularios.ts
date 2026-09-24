import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { toast } from 'sonner'

import { errosDosCampos } from '@/lib/empresas'

/**
 * Leva os erros 422 do servidor para os campos do formulário. Erro de campo que a tela não tem, ou
 * falha que não é de validação, vira um aviso.
 */
export function mostrarErrosDoServidor<T extends FieldValues>(
  erro: unknown,
  setError: UseFormSetError<T>,
  campos: Path<T>[],
  mensagemPadrao: string,
) {
  const erros = errosDosCampos(erro)
  if (!erros) return toast.error(mensagemPadrao)

  let mostrou = false
  for (const [campo, mensagem] of Object.entries(erros)) {
    if (campos.includes(campo as Path<T>)) {
      setError(campo as Path<T>, { message: mensagem })
      mostrou = true
    }
  }
  if (!mostrou) toast.error(Object.values(erros)[0] ?? mensagemPadrao)
}
