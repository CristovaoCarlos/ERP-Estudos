import { zodResolver } from '@hookform/resolvers/zod'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { errosDosCampos } from '@/lib/empresas'
import {
  tributos,
  useOpcoesParametroReceita,
  useParametroReceita,
  useSalvarParametroReceita,
  type ParametroReceita,
  type Receita,
} from '@/lib/parametros-receitas'

/** O Select do Radix não aceita valor vazio: este representa "sem receita". */
const NENHUMA = 'nenhuma'

const esquema = z.object({ receitas: z.record(z.string(), z.string()) })

type Campos = z.infer<typeof esquema>

function paraCampos(parametro?: ParametroReceita): Campos {
  return {
    receitas: Object.fromEntries(
      tributos.map(({ chave }) => [chave, String(parametro?.receitas[chave] ?? NENHUMA)]),
    ),
  }
}

function nomeDaReceita(receita: Receita): string {
  return receita.sigla ? `${receita.descricao} (${receita.sigla})` : receita.descricao
}

function Formulario({ parametro, receitas }: { parametro: ParametroReceita; receitas: Receita[] }) {
  const salvar = useSalvarParametroReceita()
  const valores = paraCampos(parametro)

  const {
    control,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm<Campos>({
    resolver: zodResolver(esquema),
    defaultValues: valores,
    // Depois de salvar, o que foi gravado vira o novo ponto de partida do "Descartar".
    values: valores,
  })

  const enviar = handleSubmit(({ receitas: escolhidas }) =>
    salvar.mutate(
      {
        receitas: Object.fromEntries(
          tributos.map(({ chave }) => {
            const valor = escolhidas[chave]
            return [chave, valor && valor !== NENHUMA ? Number(valor) : null]
          }),
        ),
      },
      {
        onSuccess: () => toast.success('Parâmetros salvos.'),
        onError: (erro) => {
          const erros = errosDosCampos(erro)
          if (!erros) return toast.error('Não foi possível salvar os parâmetros.')
          for (const [campo, mensagem] of Object.entries(erros)) {
            setError(campo as `receitas.${string}`, { message: mensagem })
          }
        },
      },
    ),
  )

  return (
    <form onSubmit={enviar} noValidate>
      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {tributos.map(({ chave, rotulo }) => {
          const erro = errors.receitas?.[chave]?.message
          return (
            <Field key={chave} data-invalid={erro ? true : undefined}>
              <FieldLabel htmlFor={`receita-${chave}`}>{rotulo}</FieldLabel>
              <Controller
                control={control}
                name={`receitas.${chave}`}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id={`receita-${chave}`}
                      className="w-full"
                      aria-invalid={erro ? true : undefined}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NENHUMA}>Sem receita</SelectItem>
                      {receitas.map((receita) => (
                        <SelectItem key={receita.id} value={String(receita.id)}>
                          {nomeDaReceita(receita)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{erro}</FieldError>
            </Field>
          )
        })}
      </CardContent>
      <CardFooter className="mt-6 justify-end gap-2 border-t">
        <Button
          type="button"
          variant="outline"
          disabled={!isDirty || salvar.isPending}
          onClick={() => reset()}
        >
          Descartar alterações
        </Button>
        <Button type="submit" disabled={salvar.isPending}>
          {salvar.isPending && <Spinner data-icon="inline-start" />}
          Salvar
        </Button>
      </CardFooter>
    </form>
  )
}

export default function Receitas() {
  const parametro = useParametroReceita()
  const opcoes = useOpcoesParametroReceita()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Receitas</h1>
        <p className="text-muted-foreground">
          Defina a receita que cada tributo usa nos lançamentos. Tributo sem receita fica sem
          lançamento.
        </p>
      </div>

      {parametro.isError || opcoes.isError ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar os parâmetros</AlertTitle>
          <AlertDescription>Tente novamente em alguns instantes.</AlertDescription>
        </Alert>
      ) : (
        <Card>
          {parametro.data && opcoes.data ? (
            <Formulario parametro={parametro.data} receitas={opcoes.data.receitas} />
          ) : (
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {tributos.map(({ chave }) => (
                <Skeleton key={chave} className="h-14 w-full" />
              ))}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  )
}
