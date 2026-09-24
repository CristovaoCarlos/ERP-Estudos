import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Shapes } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { DialogoDeCadastro } from '@/components/dialogo-de-cadastro'
import { Listagem, type Coluna } from '@/components/listagem'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import {
  useAlterarSegmento,
  useCadastrarSegmento,
  useSegmentos,
  type Segmento,
} from '@/lib/administracao-tabelas-comuns-segmentos'
import { errosDosCampos } from '@/lib/empresas'
import { mostrarErrosDoServidor } from '@/lib/formularios'

const esquema = z.object({
  descricao: z
    .string()
    .trim()
    .min(1, 'Informe a descrição.')
    .max(50, 'Use no máximo 50 caracteres.'),
})

type Campos = z.infer<typeof esquema>

function Formulario({ segmento, aoFechar }: { segmento: Segmento; aoFechar: () => void }) {
  const alterar = useAlterarSegmento(segmento.codigo)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Campos>({
    resolver: zodResolver(esquema),
    defaultValues: { descricao: segmento.descricao },
  })

  const salvar = handleSubmit((dados) =>
    alterar.mutate(dados, {
      onSuccess: () => {
        toast.success(`Segmento ${segmento.codigo} alterado.`)
        aoFechar()
      },
      onError: (erro) => {
        const erros = errosDosCampos(erro)
        if (erros?.descricao) setError('descricao', { message: erros.descricao })
        else toast.error('Não foi possível alterar o segmento.')
      },
    }),
  )

  return (
    <Dialog open onOpenChange={(abrir) => !abrir && aoFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Alterar segmento</DialogTitle>
          <DialogDescription>
            Os segmentos são os mesmos para todas as prefeituras: a alteração vale para todas.
          </DialogDescription>
        </DialogHeader>
        <form id="form-segmento" onSubmit={salvar} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="codigo">Código</FieldLabel>
              <Input
                id="codigo"
                value={segmento.codigo}
                readOnly
                disabled
                className="w-20 font-mono"
              />
              <FieldDescription>
                O código não muda: ele vai no código de barras e nos convênios das prefeituras.
              </FieldDescription>
            </Field>
            <Field data-invalid={errors.descricao ? true : undefined}>
              <FieldLabel htmlFor="descricao">Descrição</FieldLabel>
              <Input
                id="descricao"
                maxLength={50}
                aria-invalid={errors.descricao ? true : undefined}
                {...register('descricao')}
              />
              <FieldError>{errors.descricao?.message}</FieldError>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-segmento" disabled={alterar.isPending}>
            {alterar.isPending && <Spinner data-icon="inline-start" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

const esquemaDoNovo = z.object({
  codigo: z.string().trim().regex(/^\d$/, 'O código é um dígito, de 0 a 9.'),
  descricao: z
    .string()
    .trim()
    .min(1, 'Informe a descrição.')
    .max(50, 'Use no máximo 50 caracteres.'),
})

type CamposDoNovo = z.infer<typeof esquemaDoNovo>

function NovoSegmento({ aoFechar }: { aoFechar: () => void }) {
  const cadastrar = useCadastrarSegmento()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<CamposDoNovo>({
    resolver: zodResolver(esquemaDoNovo),
    defaultValues: { codigo: '', descricao: '' },
  })

  const salvar = handleSubmit((dados) =>
    cadastrar.mutate(dados, {
      onSuccess: () => {
        toast.success('Segmento cadastrado.')
        aoFechar()
      },
      onError: (erro) =>
        mostrarErrosDoServidor(
          erro,
          setError,
          ['codigo', 'descricao'],
          'Não foi possível cadastrar o segmento.',
        ),
    }),
  )

  return (
    <DialogoDeCadastro
      id="form-novo-segmento"
      titulo="Novo segmento"
      descricao="Os segmentos são os mesmos para todas as prefeituras: o novo segmento vale para todas."
      salvando={cadastrar.isPending}
      aoEnviar={salvar}
      aoFechar={aoFechar}
    >
      <Field data-invalid={errors.codigo ? true : undefined}>
        <FieldLabel htmlFor="novo-codigo">Código</FieldLabel>
        <Input
          id="novo-codigo"
          inputMode="numeric"
          maxLength={1}
          placeholder="4"
          className="w-20 font-mono"
          aria-invalid={errors.codigo ? true : undefined}
          {...register('codigo')}
        />
        <FieldError>{errors.codigo?.message}</FieldError>
      </Field>
      <Field data-invalid={errors.descricao ? true : undefined}>
        <FieldLabel htmlFor="nova-descricao">Descrição</FieldLabel>
        <Input
          id="nova-descricao"
          maxLength={50}
          placeholder="TELECOMUNICACOES"
          aria-invalid={errors.descricao ? true : undefined}
          {...register('descricao')}
        />
        <FieldError>{errors.descricao?.message}</FieldError>
      </Field>
    </DialogoDeCadastro>
  )
}

export default function Segmentos() {
  const [cadastrando, setCadastrando] = useState(false)
  const segmentos = useSegmentos()
  const [emEdicao, setEmEdicao] = useState<Segmento | null>(null)

  const colunas: Coluna<Segmento>[] = [
    {
      id: 'codigo',
      titulo: 'Código',
      className: 'w-24 font-mono',
      conteudo: (segmento) => segmento.codigo,
      busca: (segmento) => segmento.codigo,
    },
    {
      id: 'descricao',
      titulo: 'Descrição',
      className: 'font-medium',
      conteudo: (segmento) => segmento.descricao,
      busca: (segmento) => segmento.descricao,
    },
    {
      id: 'acoes',
      titulo: 'Ações',
      fixa: true,
      className: 'w-16 text-right',
      conteudo: (segmento) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Alterar ${segmento.descricao}`}
          onClick={() => setEmEdicao(segmento)}
        >
          <Pencil />
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Segmentos</h1>
          <p className="text-muted-foreground">
            Segmentos de arrecadação da FEBRABAN, usados no código de barras dos convênios.
          </p>
        </div>
        <Button onClick={() => setCadastrando(true)}>
          <Plus data-icon="inline-start" />
          Novo segmento
        </Button>
      </div>

      <Listagem
        chave="administracao-tabelas-comuns-segmentos"
        itens={segmentos.data}
        carregando={segmentos.isPending}
        erro={segmentos.isError}
        colunas={colunas}
        identificador={(segmento) => segmento.codigo}
        placeholder="Buscar por código ou descrição…"
        vazio={{
          titulo: 'Nenhum segmento',
          descricao: 'A tabela de segmentos do banco central está vazia.',
          icone: <Shapes />,
        }}
      />

      {emEdicao && <Formulario segmento={emEdicao} aoFechar={() => setEmEdicao(null)} />}

      {cadastrando && <NovoSegmento aoFechar={() => setCadastrando(false)} />}
    </div>
  )
}
