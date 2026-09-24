import { zodResolver } from '@hookform/resolvers/zod'
import { ListTree, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { DialogoDeCadastro } from '@/components/dialogo-de-cadastro'
import { Listagem, type Coluna } from '@/components/listagem'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  niveis,
  useCadastrarCnae,
  useCnae,
  type Cnae,
  type Nivel,
} from '@/lib/administracao-tabelas-comuns-cnae'
import { mostrarErrosDoServidor } from '@/lib/formularios'

const rotuloDoNivel = Object.fromEntries(niveis.map(({ valor, rotulo }) => [valor, rotulo]))

/** Recuo da denominação conforme o nível, para a hierarquia aparecer na lista. */
const recuo: Record<Nivel, string> = {
  secao: 'font-semibold',
  divisao: 'pl-3 font-medium',
  grupo: 'pl-6',
  classe: 'pl-9',
  subclasse: 'pl-12 text-muted-foreground',
}

const colunas: Coluna<Cnae>[] = [
  {
    id: 'codigo',
    titulo: 'Código',
    className: 'w-28 font-mono whitespace-nowrap',
    conteudo: (cnae) => cnae.codigo,
    busca: (cnae) => `${cnae.codigo} ${cnae.codigo.replace(/\D/g, '')}`,
  },
  {
    id: 'denominacao',
    titulo: 'Denominação',
    conteudo: (cnae) => <span className={recuo[cnae.nivel]}>{cnae.denominacao}</span>,
    busca: (cnae) => cnae.denominacao,
  },
  {
    id: 'nivel',
    titulo: 'Nível',
    className: 'w-28',
    conteudo: (cnae) => <Badge variant="outline">{rotuloDoNivel[cnae.nivel]}</Badge>,
  },
  {
    id: 'secao',
    titulo: 'Seção',
    className: 'w-20',
    ocultaPorPadrao: true,
    conteudo: (cnae) => cnae.secao,
  },
  {
    id: 'versao',
    titulo: 'Versão',
    className: 'w-20 text-muted-foreground',
    conteudo: (cnae) => cnae.versao ?? '—',
  },
  {
    id: 'situacao',
    titulo: 'Situação',
    className: 'w-24',
    conteudo: (cnae) =>
      cnae.ativo ? (
        <Badge variant="secondary">Ativa</Badge>
      ) : (
        <Badge variant="outline">Inativa</Badge>
      ),
  },
]

type Situacao = 'ativa' | 'inativa'

/** Liga e desliga um valor numa lista de filtros marcados. */
function alternar<T>(lista: T[], valor: T, marcado: boolean): T[] {
  return marcado ? [...lista, valor] : lista.filter((atual) => atual !== valor)
}

const opcional = (formato: RegExp, mensagem: string) =>
  z.string().trim().regex(formato, mensagem).or(z.literal(''))

const esquemaDaAtividade = z.object({
  secao: z
    .string()
    .trim()
    .regex(/^[A-Ua-u]$/, 'A seção é uma letra de A a U.'),
  divisao: opcional(/^\d{2}$/, 'A divisão tem 2 dígitos (ex.: 85).'),
  grupo: opcional(/^\d{2}\.\d$/, 'O grupo segue o formato 85.9.'),
  classe: opcional(/^\d{2}\.\d{2}-\d$/, 'A classe segue o formato 85.93-7.'),
  subclasse: opcional(/^\d{4}-\d\/\d{2}$/, 'A subclasse segue o formato 8593-7/00.'),
  denominacao: z
    .string()
    .trim()
    .min(1, 'Informe a denominação.')
    .max(200, 'Use no máximo 200 caracteres.'),
  versao: z.string().trim().max(4, 'Use no máximo 4 caracteres.'),
  ativo: z.boolean(),
})

type CamposDaAtividade = z.infer<typeof esquemaDaAtividade>

/** Níveis abaixo da seção, na ordem da hierarquia, com um exemplo de código. */
const niveisDoFormulario = [
  { campo: 'divisao', rotulo: 'Divisão', exemplo: '85' },
  { campo: 'grupo', rotulo: 'Grupo', exemplo: '85.9' },
  { campo: 'classe', rotulo: 'Classe', exemplo: '85.93-7' },
  { campo: 'subclasse', rotulo: 'Subclasse', exemplo: '8593-7/00' },
] as const

function NovaAtividade({ versaoPadrao, aoFechar }: { versaoPadrao: string; aoFechar: () => void }) {
  const cadastrar = useCadastrarCnae()
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CamposDaAtividade>({
    resolver: zodResolver(esquemaDaAtividade),
    defaultValues: {
      secao: '',
      divisao: '',
      grupo: '',
      classe: '',
      subclasse: '',
      denominacao: '',
      versao: versaoPadrao,
      ativo: true,
    },
  })

  const salvar = handleSubmit((dados) =>
    cadastrar.mutate(
      {
        ...dados,
        secao: dados.secao.toUpperCase(),
        divisao: dados.divisao || null,
        grupo: dados.grupo || null,
        classe: dados.classe || null,
        subclasse: dados.subclasse || null,
        versao: dados.versao || null,
      },
      {
        onSuccess: () => {
          toast.success('Atividade cadastrada.')
          aoFechar()
        },
        onError: (erro) =>
          mostrarErrosDoServidor(
            erro,
            setError,
            ['secao', 'divisao', 'grupo', 'classe', 'subclasse', 'denominacao', 'versao'],
            'Não foi possível cadastrar a atividade.',
          ),
      },
    ),
  )

  return (
    <DialogoDeCadastro
      id="form-cnae"
      titulo="Nova atividade"
      descricao="A CNAE é a mesma para todas as prefeituras: a atividade cadastrada vale para todas. Preencha até o nível da atividade; cada nível começa pelo código do nível de cima."
      salvando={cadastrar.isPending}
      aoEnviar={salvar}
      aoFechar={aoFechar}
      largo
    >
      <div className="grid gap-4 sm:grid-cols-5">
        <Field data-invalid={errors.secao ? true : undefined}>
          <FieldLabel htmlFor="secao">Seção</FieldLabel>
          <Input
            id="secao"
            maxLength={1}
            placeholder="P"
            className="font-mono uppercase"
            aria-invalid={errors.secao ? true : undefined}
            {...register('secao')}
          />
          <FieldError>{errors.secao?.message}</FieldError>
        </Field>
        {niveisDoFormulario.map(({ campo, rotulo, exemplo }) => (
          <Field key={campo} data-invalid={errors[campo] ? true : undefined}>
            <FieldLabel htmlFor={campo}>{rotulo}</FieldLabel>
            <Input
              id={campo}
              placeholder={exemplo}
              className="font-mono"
              aria-invalid={errors[campo] ? true : undefined}
              {...register(campo)}
            />
            <FieldError>{errors[campo]?.message}</FieldError>
          </Field>
        ))}
      </div>
      <Field data-invalid={errors.denominacao ? true : undefined}>
        <FieldLabel htmlFor="denominacao">Denominação</FieldLabel>
        <Input
          id="denominacao"
          maxLength={200}
          placeholder="Ensino de idiomas"
          aria-invalid={errors.denominacao ? true : undefined}
          {...register('denominacao')}
        />
        <FieldError>{errors.denominacao?.message}</FieldError>
      </Field>
      <div className="flex flex-wrap items-end gap-6">
        <Field data-invalid={errors.versao ? true : undefined} className="w-28">
          <FieldLabel htmlFor="versao">Versão</FieldLabel>
          <Input
            id="versao"
            maxLength={4}
            className="font-mono"
            aria-invalid={errors.versao ? true : undefined}
            {...register('versao')}
          />
          <FieldError>{errors.versao?.message}</FieldError>
        </Field>
        <Controller
          control={control}
          name="ativo"
          render={({ field }) => (
            <label className="flex items-center gap-2 pb-2 text-sm">
              <Checkbox
                checked={field.value}
                onCheckedChange={(marcado) => field.onChange(marcado === true)}
              />
              Ativa
            </label>
          )}
        />
      </div>
    </DialogoDeCadastro>
  )
}

export default function CnaePagina() {
  const [cadastrando, setCadastrando] = useState(false)
  const cnae = useCnae()
  const [versoes, setVersoes] = useState<string[]>([])
  const [niveisMarcados, setNiveisMarcados] = useState<Nivel[]>([])
  const [situacoes, setSituacoes] = useState<Situacao[]>([])

  const todasAsVersoes = useMemo(
    () =>
      [...new Set(cnae.data?.map((atividade) => atividade.versao ?? ''))]
        .filter(Boolean)
        .sort()
        .reverse(),
    [cnae.data],
  )

  const filtradas = cnae.data?.filter(
    (atividade) =>
      (!versoes.length || versoes.includes(atividade.versao ?? '')) &&
      (!niveisMarcados.length || niveisMarcados.includes(atividade.nivel)) &&
      (!situacoes.length || situacoes.includes(atividade.ativo ? 'ativa' : 'inativa')),
  )

  const item = (rotulo: string, marcado: boolean, aoMudar: (marcado: boolean) => void) => (
    <DropdownMenuCheckboxItem
      key={rotulo}
      checked={marcado}
      onCheckedChange={aoMudar}
      onSelect={(evento) => evento.preventDefault()}
    >
      {rotulo}
    </DropdownMenuCheckboxItem>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">CNAE</h1>
          <p className="text-muted-foreground">
            Classificação Nacional de Atividades Econômicas, da seção à subclasse.
          </p>
        </div>
        <Button onClick={() => setCadastrando(true)}>
          <Plus data-icon="inline-start" />
          Nova atividade
        </Button>
      </div>

      <Listagem
        chave="administracao-tabelas-comuns-cnae"
        itens={filtradas}
        carregando={cnae.isPending}
        erro={cnae.isError}
        colunas={colunas}
        identificador={(atividade) => atividade.id}
        placeholder="Buscar por código ou denominação…"
        filtrosAtivos={versoes.length + niveisMarcados.length + situacoes.length}
        aoLimparFiltros={() => {
          setVersoes([])
          setNiveisMarcados([])
          setSituacoes([])
        }}
        filtros={
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">Versão</DropdownMenuLabel>
            {todasAsVersoes.map((versao) =>
              item(versao, versoes.includes(versao), (marcado) =>
                setVersoes((atuais) => alternar(atuais, versao, marcado)),
              ),
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Nível</DropdownMenuLabel>
            {niveis.map(({ valor, rotulo }) =>
              item(rotulo, niveisMarcados.includes(valor), (marcado) =>
                setNiveisMarcados((atuais) => alternar(atuais, valor, marcado)),
              ),
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Situação
            </DropdownMenuLabel>
            {item('Ativa', situacoes.includes('ativa'), (marcado) =>
              setSituacoes((atuais) => alternar(atuais, 'ativa', marcado)),
            )}
            {item('Inativa', situacoes.includes('inativa'), (marcado) =>
              setSituacoes((atuais) => alternar(atuais, 'inativa', marcado)),
            )}
          </>
        }
        vazio={{
          titulo: 'Nenhuma atividade',
          descricao: 'A tabela da CNAE do banco central está vazia.',
          icone: <ListTree />,
        }}
      />

      {cadastrando && (
        <NovaAtividade
          versaoPadrao={todasAsVersoes[0] ?? ''}
          aoFechar={() => setCadastrando(false)}
        />
      )}
    </div>
  )
}
