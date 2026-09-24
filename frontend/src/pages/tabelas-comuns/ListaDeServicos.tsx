import { zodResolver } from '@hookform/resolvers/zod'
import { ListChecks, Pencil } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Listagem, type Coluna } from '@/components/listagem'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu'
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
import { Textarea } from '@/components/ui/textarea'
import { errosDosCampos } from '@/lib/empresas'
import {
  useAlterarItemLcp116,
  useListaDeServicos,
  type ItemLcp116,
} from '@/lib/tabelas-comuns-lista-de-servicos'

const esquema = z.object({
  descricao: z
    .string()
    .trim()
    .min(1, 'Informe a descrição.')
    .max(1000, 'Use no máximo 1.000 caracteres.'),
})

type Campos = z.infer<typeof esquema>

function Formulario({ item, aoFechar }: { item: ItemLcp116; aoFechar: () => void }) {
  const alterar = useAlterarItemLcp116(item.codigo)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Campos>({
    resolver: zodResolver(esquema),
    defaultValues: { descricao: item.descricao },
  })

  const salvar = handleSubmit((dados) =>
    alterar.mutate(dados, {
      onSuccess: () => {
        toast.success(`Item ${item.codigo} alterado.`)
        aoFechar()
      },
      onError: (erro) => {
        const erros = errosDosCampos(erro)
        if (erros?.descricao) setError('descricao', { message: erros.descricao })
        else toast.error('Não foi possível alterar o item.')
      },
    }),
  )

  return (
    <Dialog open onOpenChange={(abrir) => !abrir && aoFechar()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Alterar {item.tipo === 'item' ? 'item' : 'subitem'}</DialogTitle>
          <DialogDescription>
            A lista de serviços é a mesma para todas as prefeituras: a alteração vale para todas.
          </DialogDescription>
        </DialogHeader>
        <form id="form-lcp116" onSubmit={salvar} noValidate>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="codigo">Código</FieldLabel>
              <Input id="codigo" value={item.codigo} readOnly disabled className="w-32 font-mono" />
              <FieldDescription>
                O código não muda: é por ele que os serviços das prefeituras apontam para o item.
              </FieldDescription>
            </Field>
            <Field data-invalid={errors.descricao ? true : undefined}>
              <FieldLabel htmlFor="descricao">Descrição</FieldLabel>
              <Textarea
                id="descricao"
                rows={6}
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
          <Button type="submit" form="form-lcp116" disabled={alterar.isPending}>
            {alterar.isPending && <Spinner data-icon="inline-start" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function ListaDeServicos() {
  const itens = useListaDeServicos()
  const [emEdicao, setEmEdicao] = useState<ItemLcp116 | null>(null)
  const [tipos, setTipos] = useState<ItemLcp116['tipo'][]>([])

  const filtrados = tipos.length
    ? itens.data?.filter((item) => tipos.includes(item.tipo))
    : itens.data

  const colunas: Coluna<ItemLcp116>[] = [
    {
      id: 'codigo',
      titulo: 'Código',
      className: 'w-24 font-mono whitespace-nowrap',
      conteudo: (item) => item.codigo,
      busca: (item) => `${item.codigo} ${item.codigo.replace('.', '')}`,
    },
    {
      id: 'descricao',
      titulo: 'Descrição',
      className: 'whitespace-normal',
      // Subitens com recuo, abaixo do item a que pertencem.
      conteudo: (item) =>
        item.tipo === 'item' ? (
          <span className="font-semibold">{item.descricao}</span>
        ) : (
          <span className="block pl-4">{item.descricao}</span>
        ),
      busca: (item) => item.descricao,
    },
    {
      id: 'tipo',
      titulo: 'Tipo',
      className: 'w-24',
      ocultaPorPadrao: true,
      conteudo: (item) => (
        <Badge variant="outline">{item.tipo === 'item' ? 'Item' : 'Subitem'}</Badge>
      ),
    },
    {
      id: 'acoes',
      titulo: 'Ações',
      fixa: true,
      className: 'w-16 text-right',
      conteudo: (item) => (
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Alterar ${item.codigo}`}
          onClick={() => setEmEdicao(item)}
        >
          <Pencil />
        </Button>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Lista de Serviços - Lei Compl. 116/2003
        </h1>
        <p className="text-muted-foreground">
          Itens e subitens da lista de serviços do ISS.
        </p>
      </div>

      <Listagem
        chave="tabelas-comuns-lista-de-servicos"
        itens={filtrados}
        carregando={itens.isPending}
        erro={itens.isError}
        colunas={colunas}
        identificador={(item) => item.codigo}
        placeholder="Buscar por código ou descrição…"
        filtrosAtivos={tipos.length}
        aoLimparFiltros={() => setTipos([])}
        filtros={(['item', 'subitem'] as const).map((tipo) => (
          <DropdownMenuCheckboxItem
            key={tipo}
            checked={tipos.includes(tipo)}
            onCheckedChange={(marcado) =>
              setTipos((atuais) =>
                marcado ? [...atuais, tipo] : atuais.filter((atual) => atual !== tipo),
              )
            }
            onSelect={(evento) => evento.preventDefault()}
          >
            {tipo === 'item' ? 'Itens' : 'Subitens'}
          </DropdownMenuCheckboxItem>
        ))}
        vazio={{
          titulo: 'Nenhum item',
          descricao: 'A lista de serviços do banco central está vazia.',
          icone: <ListChecks />,
        }}
      />

      {emEdicao && <Formulario item={emEdicao} aoFechar={() => setEmEdicao(null)} />}
    </div>
  )
}
