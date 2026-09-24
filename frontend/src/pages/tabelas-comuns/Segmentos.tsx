import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Shapes } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

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
import { errosDosCampos } from '@/lib/empresas'
import { useAlterarSegmento, useSegmentos, type Segmento } from '@/lib/tabelas-comuns-segmentos'

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

export default function Segmentos() {
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
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Segmentos</h1>
        <p className="text-muted-foreground">
          Segmentos de arrecadação da FEBRABAN, usados no código de barras dos convênios.
        </p>
      </div>

      <Listagem
        chave="tabelas-comuns-segmentos"
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
    </div>
  )
}
