import { zodResolver } from '@hookform/resolvers/zod'
import { Hash, Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { DialogoDeCadastro } from '@/components/dialogo-de-cadastro'
import { Listagem, type Coluna } from '@/components/listagem'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  useCadastrarNotaNumeracao,
  useNumeracaoDeNotas,
  type NotaNumeracao,
} from '@/lib/administracao-tabelas-comuns-numeracao-de-notas'
import { mostrarErrosDoServidor } from '@/lib/formularios'

const colunas: Coluna<NotaNumeracao>[] = [
  {
    id: 'codigo',
    titulo: 'Código',
    className: 'w-24 font-mono',
    conteudo: (numeracao) => numeracao.codigo,
    busca: (numeracao) => numeracao.codigo,
  },
  {
    id: 'descricao',
    titulo: 'Descrição',
    className: 'font-medium',
    conteudo: (numeracao) => numeracao.descricao,
    busca: (numeracao) => numeracao.descricao,
  },
]

const esquemaDaNumeracao = z.object({
  codigo: z
    .string()
    .trim()
    .regex(/^[A-Za-z]$/, 'O código é uma letra.'),
  descricao: z
    .string()
    .trim()
    .min(1, 'Informe a descrição.')
    .max(20, 'Use no máximo 20 caracteres.'),
})

type CamposDaNumeracao = z.infer<typeof esquemaDaNumeracao>

function NovaNumeracao({ aoFechar }: { aoFechar: () => void }) {
  const cadastrar = useCadastrarNotaNumeracao()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CamposDaNumeracao>({
    resolver: zodResolver(esquemaDaNumeracao),
    defaultValues: { codigo: '', descricao: '' },
  })

  const salvar = handleSubmit(({ codigo, descricao }) =>
    cadastrar.mutate(
      { codigo: codigo.toUpperCase(), descricao },
      {
        onSuccess: () => {
          toast.success('Numeração cadastrada.')
          aoFechar()
        },
        onError: (erro) =>
          mostrarErrosDoServidor(
            erro,
            setError,
            ['codigo', 'descricao'],
            'Não foi possível cadastrar a numeração.',
          ),
      },
    ),
  )

  return (
    <DialogoDeCadastro
      id="form-numeracao"
      titulo="Nova numeração"
      descricao="Os tipos de numeração são os mesmos para todas as prefeituras: o novo tipo vale para todas."
      salvando={cadastrar.isPending}
      aoEnviar={salvar}
      aoFechar={aoFechar}
    >
      <Field data-invalid={errors.codigo ? true : undefined}>
        <FieldLabel htmlFor="codigo">Código</FieldLabel>
        <Input
          id="codigo"
          maxLength={1}
          placeholder="A"
          className="w-20 font-mono uppercase"
          aria-invalid={errors.codigo ? true : undefined}
          {...register('codigo')}
        />
        <FieldError>{errors.codigo?.message}</FieldError>
      </Field>
      <Field data-invalid={errors.descricao ? true : undefined}>
        <FieldLabel htmlFor="descricao">Descrição</FieldLabel>
        <Input
          id="descricao"
          maxLength={20}
          placeholder="AUTOMÁTICO"
          aria-invalid={errors.descricao ? true : undefined}
          {...register('descricao')}
        />
        <FieldError>{errors.descricao?.message}</FieldError>
      </Field>
    </DialogoDeCadastro>
  )
}

export default function NumeracaoDeNotas() {
  const [cadastrando, setCadastrando] = useState(false)
  const numeracoes = useNumeracaoDeNotas()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Numeração de Notas</h1>
          <p className="text-muted-foreground">Tipos de numeração da nota fiscal.</p>
        </div>
        <Button onClick={() => setCadastrando(true)}>
          <Plus data-icon="inline-start" />
          Nova numeração
        </Button>
      </div>

      <Listagem
        chave="administracao-tabelas-comuns-numeracao-de-notas"
        itens={numeracoes.data}
        carregando={numeracoes.isPending}
        erro={numeracoes.isError}
        colunas={colunas}
        identificador={(numeracao) => numeracao.codigo}
        placeholder="Buscar por código ou descrição…"
        vazio={{
          titulo: 'Nenhum tipo de numeração',
          descricao: 'A tabela de numeração de notas do banco central está vazia.',
          icone: <Hash />,
        }}
      />

      {cadastrando && <NovaNumeracao aoFechar={() => setCadastrando(false)} />}
    </div>
  )
}
