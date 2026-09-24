import { zodResolver } from '@hookform/resolvers/zod'
import { Landmark, Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { DialogoDeCadastro } from '@/components/dialogo-de-cadastro'
import { Listagem, type Coluna } from '@/components/listagem'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useBancos, useCadastrarBanco, type Banco } from '@/lib/administracao-tabelas-comuns-bancos'
import { mostrarErrosDoServidor } from '@/lib/formularios'

const colunas: Coluna<Banco>[] = [
  {
    id: 'codigo',
    titulo: 'Código',
    className: 'w-24 font-mono text-muted-foreground',
    conteudo: (banco) => banco.codigo,
    busca: (banco) => banco.codigo,
  },
  {
    id: 'nome',
    titulo: 'Banco',
    className: 'font-medium',
    conteudo: (banco) => banco.nome,
    busca: (banco) => banco.nome,
  },
]

const esquemaDoBanco = z.object({
  codigo: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'O código tem 4 dígitos (com zeros à esquerda, ex.: 0001).'),
  nome: z.string().trim().min(1, 'Informe o nome.').max(100, 'Use no máximo 100 caracteres.'),
})

type CamposDoBanco = z.infer<typeof esquemaDoBanco>

function NovoBanco({ aoFechar }: { aoFechar: () => void }) {
  const cadastrar = useCadastrarBanco()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CamposDoBanco>({
    resolver: zodResolver(esquemaDoBanco),
    defaultValues: { codigo: '', nome: '' },
  })

  const salvar = handleSubmit((dados) =>
    cadastrar.mutate(dados, {
      onSuccess: () => {
        toast.success('Banco cadastrado.')
        aoFechar()
      },
      onError: (erro) =>
        mostrarErrosDoServidor(
          erro,
          setError,
          ['codigo', 'nome'],
          'Não foi possível cadastrar o banco.',
        ),
    }),
  )

  return (
    <DialogoDeCadastro
      id="form-banco"
      titulo="Novo banco"
      descricao="Os bancos são os mesmos para todas as prefeituras: o banco cadastrado vale para todas."
      salvando={cadastrar.isPending}
      aoEnviar={salvar}
      aoFechar={aoFechar}
    >
      <Field data-invalid={errors.codigo ? true : undefined}>
        <FieldLabel htmlFor="codigo">Código de compensação</FieldLabel>
        <Input
          id="codigo"
          inputMode="numeric"
          maxLength={4}
          placeholder="0001"
          className="w-28 font-mono"
          aria-invalid={errors.codigo ? true : undefined}
          {...register('codigo')}
        />
        <FieldError>{errors.codigo?.message}</FieldError>
      </Field>
      <Field data-invalid={errors.nome ? true : undefined}>
        <FieldLabel htmlFor="nome">Nome</FieldLabel>
        <Input
          id="nome"
          maxLength={100}
          placeholder="Banco do Brasil S.A."
          aria-invalid={errors.nome ? true : undefined}
          {...register('nome')}
        />
        <FieldError>{errors.nome?.message}</FieldError>
      </Field>
    </DialogoDeCadastro>
  )
}

export default function Bancos() {
  const [cadastrando, setCadastrando] = useState(false)
  const bancos = useBancos()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Bancos</h1>
          <p className="text-muted-foreground">Bancos com o código de compensação.</p>
        </div>
        <Button onClick={() => setCadastrando(true)}>
          <Plus data-icon="inline-start" />
          Novo banco
        </Button>
      </div>

      <Listagem
        chave="administracao-tabelas-comuns-bancos"
        itens={bancos.data}
        carregando={bancos.isPending}
        erro={bancos.isError}
        colunas={colunas}
        identificador={(banco) => banco.id}
        placeholder="Buscar por código ou nome…"
        vazio={{
          titulo: 'Nenhum banco',
          descricao: 'A tabela de bancos do banco central está vazia.',
          icone: <Landmark />,
        }}
      />

      {cadastrando && <NovoBanco aoFechar={() => setCadastrando(false)} />}
    </div>
  )
}
