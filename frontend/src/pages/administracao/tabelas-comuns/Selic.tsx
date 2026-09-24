import { zodResolver } from '@hookform/resolvers/zod'
import { Plus, TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { DialogoDeCadastro } from '@/components/dialogo-de-cadastro'
import { Listagem, type Coluna } from '@/components/listagem'
import { Button } from '@/components/ui/button'
import { DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCadastrarSelic, useSelic, type Selic } from '@/lib/administracao-tabelas-comuns-selic'
import { mostrarErrosDoServidor } from '@/lib/formularios'

const nomeDoMes = new Intl.DateTimeFormat('pt-BR', { month: 'long' })
const percentual = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function mesPorExtenso(mes: number): string {
  const nome = nomeDoMes.format(new Date(2000, mes - 1, 1))
  return nome.charAt(0).toUpperCase() + nome.slice(1)
}

function competencia(selic: Selic): string {
  return `${String(selic.mes).padStart(2, '0')}/${selic.ano}`
}

const colunas: Coluna<Selic>[] = [
  {
    id: 'competencia',
    titulo: 'Competência',
    className: 'w-32 font-mono',
    conteudo: competencia,
    busca: competencia,
  },
  {
    id: 'mes',
    titulo: 'Mês',
    conteudo: (selic) => `${mesPorExtenso(selic.mes)} de ${selic.ano}`,
    busca: (selic) => `${mesPorExtenso(selic.mes)} ${selic.ano}`,
  },
  {
    id: 'valor',
    titulo: 'Taxa',
    className: 'w-32 text-right tabular-nums',
    conteudo: (selic) =>
      selic.valor === null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        `${percentual.format(Number(selic.valor))}%`
      ),
  },
]

const esquemaDaTaxa = z.object({
  ano: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'Informe o ano com 4 dígitos.'),
  mes: z.string().min(1, 'Escolha o mês.'),
  valor: z
    .string()
    .trim()
    .regex(/^(\d{1,3}([.,]\d{1,2})?)?$/, 'Informe a taxa com até 2 casas (ex.: 0,87).'),
})

type CamposDaTaxa = z.infer<typeof esquemaDaTaxa>

function NovaTaxa({ aoFechar }: { aoFechar: () => void }) {
  const cadastrar = useCadastrarSelic()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CamposDaTaxa>({
    resolver: zodResolver(esquemaDaTaxa),
    defaultValues: { ano: String(new Date().getFullYear()), mes: '', valor: '' },
  })

  const salvar = handleSubmit(({ ano, mes, valor }) =>
    cadastrar.mutate(
      { ano: Number(ano), mes: Number(mes), valor: valor ? valor.replace(',', '.') : null },
      {
        onSuccess: () => {
          toast.success(`Taxa de ${mes.padStart(2, '0')}/${ano} cadastrada.`)
          aoFechar()
        },
        onError: (erro) =>
          mostrarErrosDoServidor(
            erro,
            setError,
            ['ano', 'mes', 'valor'],
            'Não foi possível cadastrar a taxa.',
          ),
      },
    ),
  )

  return (
    <DialogoDeCadastro
      id="form-selic"
      titulo="Nova taxa"
      descricao="A SELIC é a mesma para todas as prefeituras: a taxa cadastrada vale para todas."
      salvando={cadastrar.isPending}
      aoEnviar={salvar}
      aoFechar={aoFechar}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field data-invalid={errors.ano ? true : undefined}>
          <FieldLabel htmlFor="ano">Ano</FieldLabel>
          <Input
            id="ano"
            inputMode="numeric"
            maxLength={4}
            className="font-mono"
            aria-invalid={errors.ano ? true : undefined}
            {...register('ano')}
          />
          <FieldError>{errors.ano?.message}</FieldError>
        </Field>
        <Field data-invalid={errors.mes ? true : undefined}>
          <FieldLabel htmlFor="mes">Mês</FieldLabel>
          <Controller
            control={control}
            name="mes"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  id="mes"
                  className="w-full"
                  aria-invalid={errors.mes ? true : undefined}
                >
                  <SelectValue placeholder="Escolha o mês" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((mes) => (
                    <SelectItem key={mes} value={String(mes)}>
                      {mesPorExtenso(mes)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          <FieldError>{errors.mes?.message}</FieldError>
        </Field>
      </div>
      <Field data-invalid={errors.valor ? true : undefined}>
        <FieldLabel htmlFor="valor">Taxa (%)</FieldLabel>
        <Input
          id="valor"
          inputMode="decimal"
          placeholder="0,87"
          className="w-32 text-right tabular-nums"
          aria-invalid={errors.valor ? true : undefined}
          {...register('valor')}
        />
        <FieldDescription>Deixe em branco se a taxa do mês ainda não saiu.</FieldDescription>
        <FieldError>{errors.valor?.message}</FieldError>
      </Field>
    </DialogoDeCadastro>
  )
}

export default function SelicPagina() {
  const [cadastrando, setCadastrando] = useState(false)
  const selic = useSelic()
  const [anos, setAnos] = useState<number[]>([])

  const todosOsAnos = useMemo(
    () => [...new Set(selic.data?.map((taxa) => taxa.ano))].sort((a, b) => b - a),
    [selic.data],
  )

  const filtradas = anos.length ? selic.data?.filter((taxa) => anos.includes(taxa.ano)) : selic.data

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">SELIC</h1>
          <p className="text-muted-foreground">
            Taxa SELIC de cada mês, usada na correção de tributos.
          </p>
        </div>
        <Button onClick={() => setCadastrando(true)}>
          <Plus data-icon="inline-start" />
          Nova taxa
        </Button>
      </div>

      <Listagem
        chave="administracao-tabelas-comuns-selic"
        itens={filtradas}
        carregando={selic.isPending}
        erro={selic.isError}
        colunas={colunas}
        identificador={(taxa) => taxa.id}
        placeholder="Buscar por competência ou mês…"
        filtrosAtivos={anos.length}
        aoLimparFiltros={() => setAnos([])}
        filtros={
          <div className="max-h-72 overflow-y-auto">
            {todosOsAnos.map((ano) => (
              <DropdownMenuCheckboxItem
                key={ano}
                checked={anos.includes(ano)}
                onCheckedChange={(marcado) =>
                  setAnos((atuais) =>
                    marcado ? [...atuais, ano] : atuais.filter((atual) => atual !== ano),
                  )
                }
                onSelect={(evento) => evento.preventDefault()}
              >
                {ano}
              </DropdownMenuCheckboxItem>
            ))}
          </div>
        }
        vazio={{
          titulo: 'Nenhuma taxa cadastrada',
          descricao: 'A tabela da SELIC do banco central ainda não tem nenhum mês.',
          icone: <TrendingUp />,
        }}
      />

      {cadastrando && <NovaTaxa aoFechar={() => setCadastrando(false)} />}
    </div>
  )
}
