import { useForm, type GenericObject, type Path, type TypedSchema } from 'vee-validate'
import { toast } from 'vue-sonner'
import type { z } from 'zod'

import { errosDosCampos } from '@/lib/empresas'

/**
 * Caminho do campo como o vee-validate grava os erros: índices de lista entre colchetes
 * (`itens[0].quantidade`). Com ponto (`itens.0.quantidade`), o erro seria apagado na validação
 * seguinte, que confere a chave com colchetes.
 */
function caminhoDoCampo(partes: PropertyKey[]): string {
  return partes
    .map((parte, posicao) =>
      typeof parte === 'number' ? `[${parte}]` : `${posicao ? '.' : ''}${String(parte)}`,
    )
    .join('')
}

/**
 * Adapta um schema do zod 4 ao vee-validate: o adaptador oficial (`@vee-validate/zod`) só aceita
 * o zod 3. Cada erro vai para o caminho do campo (`receitas.iss`, `itens[0].quantidade`).
 */
export function esquemaZod<T extends z.ZodType>(esquema: T): TypedSchema<z.input<T>, z.output<T>> {
  return {
    __type: 'VVTypedSchema',
    async parse(valores) {
      const resultado = await esquema.safeParseAsync(valores)
      if (resultado.success) return { value: resultado.data, errors: [] }

      const porCampo = new Map<string, string[]>()
      for (const problema of resultado.error.issues) {
        const caminho = caminhoDoCampo(problema.path)
        porCampo.set(caminho, [...(porCampo.get(caminho) ?? []), problema.message])
      }
      return { errors: [...porCampo].map(([path, errors]) => ({ path, errors })) }
    },
  }
}

/**
 * Formulário com validação pelo schema, como no restante do sistema: os erros aparecem no envio
 * e, depois do primeiro envio, são conferidos a cada alteração.
 */
export function useFormulario<T extends z.ZodType<GenericObject, GenericObject>>(
  esquema: T,
  valoresIniciais: z.input<T>,
) {
  const formulario = useForm<z.input<T>, z.output<T>>({
    validationSchema: esquemaZod(esquema),
    initialValues: valoresIniciais as never,
  })

  /** `v-model` e atributos de um campo. */
  const campo = <C extends Path<z.input<T>>>(nome: C) =>
    formulario.defineField(nome, () => ({
      validateOnModelUpdate: formulario.submitCount.value > 0,
    }))

  return { ...formulario, campo }
}

/**
 * Leva os erros 422 do servidor para os campos do formulário. Erro de campo que a tela não tem, ou
 * falha que não é de validação, vira um aviso.
 */
export function mostrarErrosDoServidor<C extends string>(
  erro: unknown,
  setFieldError: (campo: C, mensagem: string) => void,
  campos: C[],
  mensagemPadrao: string,
) {
  const erros = errosDosCampos(erro)
  if (!erros) return toast.error(mensagemPadrao)

  let mostrou = false
  for (const [campo, mensagem] of Object.entries(erros)) {
    if (campos.includes(campo as C)) {
      setFieldError(campo as C, mensagem)
      mostrou = true
    }
  }
  if (!mostrou) toast.error(Object.values(erros)[0] ?? mensagemPadrao)
}
