import { zodResolver } from '@hookform/resolvers/zod'
import { MapPinned, Pencil, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { DialogoDeCadastro } from '@/components/dialogo-de-cadastro'
import { Listagem, type Coluna } from '@/components/listagem'
import { Badge } from '@/components/ui/badge'
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
import {
  useAlterarCidade,
  useCadastrarCidade,
  useCidades,
  type Cidade,
} from '@/lib/administracao-tabelas-comuns-cidades'
import { mostrarErrosDoServidor } from '@/lib/formularios'

const colunas: Coluna<Cidade>[] = [
  {
    id: 'nome',
    titulo: 'Cidade',
    className: 'font-medium',
    conteudo: (cidade) => cidade.nome,
    busca: (cidade) => cidade.nome,
  },
  {
    id: 'uf',
    titulo: 'UF',
    className: 'w-20',
    conteudo: (cidade) => <Badge variant="outline">{cidade.uf}</Badge>,
    busca: (cidade) => cidade.uf,
  },
  {
    id: 'codigo_ibge',
    titulo: 'Código IBGE',
    className: 'w-36 font-mono text-muted-foreground',
    conteudo: (cidade) => cidade.codigo_ibge,
    busca: (cidade) => cidade.codigo_ibge,
  },
]

const UFS = [
  'AC',
  'AL',
  'AM',
  'AP',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MG',
  'MS',
  'MT',
  'PA',
  'PB',
  'PE',
  'PI',
  'PR',
  'RJ',
  'RN',
  'RO',
  'RR',
  'RS',
  'SC',
  'SE',
  'SP',
  'TO',
]

const esquemaDaCidade = z.object({
  codigo_ibge: z
    .string()
    .trim()
    .regex(/^\d{7}$/, 'O código do IBGE tem 7 dígitos.'),
  nome: z.string().trim().min(1, 'Informe o nome.').max(100, 'Use no máximo 100 caracteres.'),
  uf: z.string().min(1, 'Escolha a UF.'),
})

type CamposDaCidade = z.infer<typeof esquemaDaCidade>

/** UF numa lista de seleção, usada na inclusão e na alteração. */
function CampoUf({
  id,
  valor,
  aoMudar,
  erro,
}: {
  id: string
  valor: string
  aoMudar: (uf: string) => void
  erro?: string
}) {
  return (
    <Field data-invalid={erro ? true : undefined}>
      <FieldLabel htmlFor={id}>UF</FieldLabel>
      <Select value={valor} onValueChange={aoMudar}>
        <SelectTrigger id={id} className="w-28" aria-invalid={erro ? true : undefined}>
          <SelectValue placeholder="UF" />
        </SelectTrigger>
        <SelectContent>
          {UFS.map((uf) => (
            <SelectItem key={uf} value={uf}>
              {uf}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FieldError>{erro}</FieldError>
    </Field>
  )
}

function NovaCidade({ aoFechar }: { aoFechar: () => void }) {
  const cadastrar = useCadastrarCidade()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CamposDaCidade>({
    resolver: zodResolver(esquemaDaCidade),
    defaultValues: { codigo_ibge: '', nome: '', uf: '' },
  })

  const salvar = handleSubmit((dados) =>
    cadastrar.mutate(dados, {
      onSuccess: () => {
        toast.success('Cidade cadastrada.')
        aoFechar()
      },
      onError: (erro) =>
        mostrarErrosDoServidor(
          erro,
          setError,
          ['codigo_ibge', 'nome', 'uf'],
          'Não foi possível cadastrar a cidade.',
        ),
    }),
  )

  return (
    <DialogoDeCadastro
      id="form-cidade"
      titulo="Nova cidade"
      descricao="As cidades são as mesmas para todas as prefeituras: a cidade cadastrada vale para todas."
      salvando={cadastrar.isPending}
      aoEnviar={salvar}
      aoFechar={aoFechar}
    >
      <Field data-invalid={errors.codigo_ibge ? true : undefined}>
        <FieldLabel htmlFor="codigo_ibge">Código IBGE</FieldLabel>
        <Input
          id="codigo_ibge"
          inputMode="numeric"
          maxLength={7}
          placeholder="3550308"
          className="w-32 font-mono"
          aria-invalid={errors.codigo_ibge ? true : undefined}
          {...register('codigo_ibge')}
        />
        <FieldError>{errors.codigo_ibge?.message}</FieldError>
      </Field>
      <Field data-invalid={errors.nome ? true : undefined}>
        <FieldLabel htmlFor="nome">Nome</FieldLabel>
        <Input
          id="nome"
          maxLength={100}
          placeholder="São Paulo"
          aria-invalid={errors.nome ? true : undefined}
          {...register('nome')}
        />
        <FieldError>{errors.nome?.message}</FieldError>
      </Field>
      <Controller
        control={control}
        name="uf"
        render={({ field }) => (
          <CampoUf id="uf" valor={field.value} aoMudar={field.onChange} erro={errors.uf?.message} />
        )}
      />
    </DialogoDeCadastro>
  )
}

const esquemaDaAlteracao = esquemaDaCidade.omit({ codigo_ibge: true })

type CamposDaAlteracao = z.infer<typeof esquemaDaAlteracao>

/** Altera nome e UF. O código do IBGE aparece, mas não muda: é ele que identifica o município. */
function AlterarCidade({ cidade, aoFechar }: { cidade: Cidade; aoFechar: () => void }) {
  const alterar = useAlterarCidade(cidade.id)
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CamposDaAlteracao>({
    resolver: zodResolver(esquemaDaAlteracao),
    defaultValues: { nome: cidade.nome, uf: cidade.uf },
  })

  const salvar = handleSubmit((dados) =>
    alterar.mutate(dados, {
      onSuccess: () => {
        toast.success(`Cidade ${dados.nome} alterada.`)
        aoFechar()
      },
      onError: (erro) =>
        mostrarErrosDoServidor(
          erro,
          setError,
          ['nome', 'uf'],
          'Não foi possível alterar a cidade.',
        ),
    }),
  )

  return (
    <DialogoDeCadastro
      id="form-alterar-cidade"
      titulo="Alterar cidade"
      descricao="As cidades são as mesmas para todas as prefeituras: a alteração vale para todas."
      salvando={alterar.isPending}
      aoEnviar={salvar}
      aoFechar={aoFechar}
      rotuloDoBotao="Salvar"
    >
      <Field>
        <FieldLabel htmlFor="alterar-codigo">Código IBGE</FieldLabel>
        <Input
          id="alterar-codigo"
          value={cidade.codigo_ibge}
          readOnly
          disabled
          className="w-32 font-mono"
        />
        <FieldDescription>O código do IBGE identifica o município e não muda.</FieldDescription>
      </Field>
      <Field data-invalid={errors.nome ? true : undefined}>
        <FieldLabel htmlFor="alterar-nome">Nome</FieldLabel>
        <Input
          id="alterar-nome"
          maxLength={100}
          aria-invalid={errors.nome ? true : undefined}
          {...register('nome')}
        />
        <FieldError>{errors.nome?.message}</FieldError>
      </Field>
      <Controller
        control={control}
        name="uf"
        render={({ field }) => (
          <CampoUf
            id="alterar-uf"
            valor={field.value}
            aoMudar={field.onChange}
            erro={errors.uf?.message}
          />
        )}
      />
    </DialogoDeCadastro>
  )
}

export default function Cidades() {
  const [cadastrando, setCadastrando] = useState(false)
  const [emEdicao, setEmEdicao] = useState<Cidade | null>(null)
  const cidades = useCidades()
  const [ufs, setUfs] = useState<string[]>([])

  const todasAsUfs = useMemo(
    () => [...new Set(cidades.data?.map((cidade) => cidade.uf))].sort(),
    [cidades.data],
  )

  const colunasComAcoes: Coluna<Cidade>[] = [
    ...colunas,
    {
      id: 'acoes',
      titulo: 'Ações',
      fixa: true,
      className: 'w-16 text-right',
      conteudo: (cidade) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Alterar ${cidade.nome}`}
          onClick={() => setEmEdicao(cidade)}
        >
          <Pencil />
        </Button>
      ),
    },
  ]

  const filtradas = ufs.length
    ? cidades.data?.filter((cidade) => ufs.includes(cidade.uf))
    : cidades.data

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Cidades</h1>
          <p className="text-muted-foreground">Todos os Municípios com UF e código IBGE.</p>
        </div>
        <Button onClick={() => setCadastrando(true)}>
          <Plus data-icon="inline-start" />
          Nova cidade
        </Button>
      </div>

      <Listagem
        chave="administracao-tabelas-comuns-cidades"
        itens={filtradas}
        carregando={cidades.isPending}
        erro={cidades.isError}
        colunas={colunasComAcoes}
        identificador={(cidade) => cidade.id}
        placeholder="Buscar por cidade, UF ou código IBGE…"
        filtrosAtivos={ufs.length}
        aoLimparFiltros={() => setUfs([])}
        filtros={
          // 27 UFs: a lista rola dentro do menu.
          <div className="max-h-72 overflow-y-auto">
            {todasAsUfs.map((uf) => (
              <DropdownMenuCheckboxItem
                key={uf}
                checked={ufs.includes(uf)}
                onCheckedChange={(marcado) =>
                  setUfs((atuais) =>
                    marcado ? [...atuais, uf] : atuais.filter((atual) => atual !== uf),
                  )
                }
                onSelect={(evento) => evento.preventDefault()}
              >
                {uf}
              </DropdownMenuCheckboxItem>
            ))}
          </div>
        }
        vazio={{
          titulo: 'Nenhuma cidade',
          descricao: 'A tabela de cidades do banco central está vazia.',
          icone: <MapPinned />,
        }}
      />

      {cadastrando && <NovaCidade aoFechar={() => setCadastrando(false)} />}
      {emEdicao && <AlterarCidade cidade={emEdicao} aoFechar={() => setEmEdicao(null)} />}
    </div>
  )
}
