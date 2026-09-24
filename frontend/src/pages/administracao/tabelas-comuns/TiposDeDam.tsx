import { zodResolver } from '@hookform/resolvers/zod'
import { FileType, Plus } from 'lucide-react'
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
  useCadastrarDamTipo,
  useTiposDeDam,
  type DamTipo,
} from '@/lib/administracao-tabelas-comuns-tipos-de-dam'
import { mostrarErrosDoServidor } from '@/lib/formularios'

const colunas: Coluna<DamTipo>[] = [
  {
    id: 'codigo',
    titulo: 'Código',
    className: 'w-24 font-mono',
    conteudo: (tipo) => tipo.codigo,
    busca: (tipo) => String(tipo.codigo),
  },
  {
    id: 'descricao',
    titulo: 'Descrição',
    className: 'font-medium',
    conteudo: (tipo) => tipo.descricao,
    busca: (tipo) => tipo.descricao,
  },
]

const esquemaDoTipo = z.object({
  codigo: z
    .string()
    .trim()
    .regex(/^[1-9]\d{0,3}$/, 'Use um código de 1 a 9999.'),
  descricao: z
    .string()
    .trim()
    .min(1, 'Informe a descrição.')
    .max(20, 'Use no máximo 20 caracteres.'),
})

type CamposDoTipo = z.infer<typeof esquemaDoTipo>

function NovoTipoDeDam({ aoFechar }: { aoFechar: () => void }) {
  const cadastrar = useCadastrarDamTipo()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CamposDoTipo>({
    resolver: zodResolver(esquemaDoTipo),
    defaultValues: { codigo: '', descricao: '' },
  })

  const salvar = handleSubmit(({ codigo, descricao }) =>
    cadastrar.mutate(
      { codigo: Number(codigo), descricao },
      {
        onSuccess: () => {
          toast.success('Tipo de DAM cadastrado.')
          aoFechar()
        },
        onError: (erro) =>
          mostrarErrosDoServidor(
            erro,
            setError,
            ['codigo', 'descricao'],
            'Não foi possível cadastrar o tipo de DAM.',
          ),
      },
    ),
  )

  return (
    <DialogoDeCadastro
      id="form-tipo-de-dam"
      titulo="Novo tipo de DAM"
      descricao="Os tipos de DAM são os mesmos para todas as prefeituras: o novo tipo vale para todas."
      salvando={cadastrar.isPending}
      aoEnviar={salvar}
      aoFechar={aoFechar}
    >
      <Field data-invalid={errors.codigo ? true : undefined}>
        <FieldLabel htmlFor="codigo">Código</FieldLabel>
        <Input
          id="codigo"
          inputMode="numeric"
          maxLength={4}
          placeholder="8"
          className="w-24 font-mono"
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
          placeholder="MULTAS"
          aria-invalid={errors.descricao ? true : undefined}
          {...register('descricao')}
        />
        <FieldError>{errors.descricao?.message}</FieldError>
      </Field>
    </DialogoDeCadastro>
  )
}

export default function TiposDeDam() {
  const [cadastrando, setCadastrando] = useState(false)
  const tipos = useTiposDeDam()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Tipos de DAM</h1>
          <p className="text-muted-foreground">Tipos de documento de arrecadação.</p>
        </div>
        <Button onClick={() => setCadastrando(true)}>
          <Plus data-icon="inline-start" />
          Novo tipo de DAM
        </Button>
      </div>

      <Listagem
        chave="administracao-tabelas-comuns-tipos-de-dam"
        itens={tipos.data}
        carregando={tipos.isPending}
        erro={tipos.isError}
        colunas={colunas}
        identificador={(tipo) => tipo.codigo}
        placeholder="Buscar por código ou descrição…"
        vazio={{
          titulo: 'Nenhum tipo de DAM',
          descricao: 'A tabela de tipos de DAM do banco central está vazia.',
          icone: <FileType />,
        }}
      />

      {cadastrando && <NovoTipoDeDam aoFechar={() => setCadastrando(false)} />}
    </div>
  )
}
