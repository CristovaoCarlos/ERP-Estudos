import { zodResolver } from '@hookform/resolvers/zod'
import { LockKeyhole, Pencil, Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Listagem, type Coluna } from '@/components/listagem'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import {
  useAlterarGrupo,
  useCadastrarGrupo,
  useGrupos,
  useRemoverGrupo,
  type Grupo,
} from '@/lib/grupos'
import { permissaoDaTela, telasPorModulo } from '@/lib/navegacao'

const esquema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.').max(60, 'Use no máximo 60 caracteres.'),
})

type Campos = z.infer<typeof esquema>

const modulos = telasPorModulo()

/** `grupo` ausente: cadastro. Presente: alteração. */
function Formulario({ grupo, aoFechar }: { grupo?: Grupo; aoFechar: () => void }) {
  const cadastrar = useCadastrarGrupo()
  const alterar = useAlterarGrupo(grupo?.id ?? 0)
  const salvamento = grupo ? alterar : cadastrar
  const [telas, setTelas] = useState<string[]>(grupo?.telas ?? [])

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Campos>({
    resolver: zodResolver(esquema),
    values: { nome: grupo?.nome ?? '' },
  })

  const alternar = (permissao: string, marcado: boolean) =>
    setTelas((atuais) =>
      marcado ? [...atuais, permissao] : atuais.filter((atual) => atual !== permissao),
    )

  const marcarModulo = (permissoes: string[], marcar: boolean) =>
    setTelas((atuais) =>
      marcar
        ? [...new Set([...atuais, ...permissoes])]
        : atuais.filter((atual) => !permissoes.includes(atual)),
    )

  const salvar = handleSubmit(({ nome }) => {
    const acao = grupo ? alterar : cadastrar
    acao.mutate(
      { nome, telas },
      {
        onSuccess: () => {
          toast.success(grupo ? 'Grupo alterado.' : 'Grupo cadastrado.')
          aoFechar()
        },
        onError: (erro) => {
          const erros = errosDosCampos(erro)
          if (erros?.nome) setError('nome', { message: erros.nome })
          else toast.error(Object.values(erros ?? {})[0] ?? 'Não foi possível salvar o grupo.')
        },
      },
    )
  })

  return (
    <Dialog open onOpenChange={(abrir) => !abrir && aoFechar()}>
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{grupo ? 'Alterar grupo' : 'Novo grupo'}</DialogTitle>
          <DialogDescription>
            Escolha as telas do grupo. Quem estiver nele enxerga no menu apenas essas telas, além do
            Início.
          </DialogDescription>
        </DialogHeader>
        <form id="form-grupo" onSubmit={salvar} noValidate>
          <FieldGroup>
            <Field data-invalid={errors.nome ? true : undefined}>
              <FieldLabel htmlFor="nome">Nome</FieldLabel>
              <Input
                id="nome"
                placeholder="Fiscalização de obras"
                aria-invalid={errors.nome ? true : undefined}
                {...register('nome')}
              />
              <FieldError>{errors.nome?.message}</FieldError>
            </Field>
            <Field>
              <FieldLabel htmlFor="telas">Telas</FieldLabel>
              <div id="telas" className="flex flex-col gap-5">
                {modulos.map(({ modulo, telas: doModulo }) => {
                  const permissoes = doModulo.map((tela) => permissaoDaTela(tela.url))
                  const marcadas = permissoes.filter((permissao) =>
                    telas.includes(permissao),
                  ).length

                  return (
                    <fieldset key={modulo.url} className="flex flex-col gap-2">
                      <legend className="sr-only">{modulo.titulo}</legend>
                      <div className="flex items-center justify-between gap-4 border-b pb-1">
                        <span className="flex items-center gap-2 text-sm font-medium">
                          <modulo.icone className="size-4 text-muted-foreground" />
                          {modulo.titulo}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => marcarModulo(permissoes, marcadas < permissoes.length)}
                        >
                          {marcadas < permissoes.length ? 'Marcar todas' : 'Desmarcar todas'}
                        </Button>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {doModulo.map((tela) => {
                          const permissao = permissaoDaTela(tela.url)
                          return (
                            <label
                              key={tela.url}
                              className="flex items-center gap-2 text-sm text-muted-foreground"
                            >
                              <Checkbox
                                checked={telas.includes(permissao)}
                                onCheckedChange={(marcado) => alternar(permissao, marcado === true)}
                              />
                              {tela.titulo}
                            </label>
                          )
                        })}
                      </div>
                    </fieldset>
                  )
                })}
              </div>
              <FieldDescription>
                {telas.length} tela(s) selecionada(s). Sem nenhuma, o grupo não libera nada.
              </FieldDescription>
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="submit" form="form-grupo" disabled={salvamento.isPending}>
            {salvamento.isPending && <Spinner data-icon="inline-start" />}
            {grupo ? 'Salvar' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmarExclusao({ grupo, aoFechar }: { grupo: Grupo | null; aoFechar: () => void }) {
  const remover = useRemoverGrupo()

  return (
    <Dialog open={grupo !== null} onOpenChange={(abrir) => !abrir && aoFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir grupo</DialogTitle>
          <DialogDescription>
            O grupo {grupo?.nome} deixa de existir nesta prefeitura. Grupos em uso por algum usuário
            não podem ser excluídos.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={remover.isPending}
            onClick={() =>
              grupo &&
              remover.mutate(grupo.id, {
                onSuccess: () => {
                  toast.success(`Grupo ${grupo.nome} excluído.`)
                  aoFechar()
                },
                onError: (erro) => {
                  const erros = errosDosCampos(erro)
                  toast.error(erros?.grupo ?? 'Não foi possível excluir o grupo.')
                },
              })
            }
          >
            {remover.isPending && <Spinner data-icon="inline-start" />}
            Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function Grupos() {
  const grupos = useGrupos()
  const [emEdicao, setEmEdicao] = useState<Grupo | null>(null)
  const [cadastrando, setCadastrando] = useState(false)
  const [excluindo, setExcluindo] = useState<Grupo | null>(null)

  const colunas: Coluna<Grupo>[] = [
    {
      id: 'nome',
      titulo: 'Nome',
      className: 'font-medium',
      conteudo: (grupo) => (
        <>
          {grupo.nome}
          {grupo.sistema && (
            <Badge variant="outline" className="ml-2">
              Sistema
            </Badge>
          )}
        </>
      ),
      busca: (grupo) => grupo.nome,
    },
    {
      id: 'telas',
      titulo: 'Telas',
      conteudo: (grupo) => <Badge variant="secondary">{grupo.telas.length}</Badge>,
    },
    {
      id: 'usuarios',
      titulo: 'Usuários',
      className: 'text-muted-foreground',
      conteudo: (grupo) => grupo.usuarios,
    },
    {
      id: 'acoes',
      titulo: 'Ações',
      fixa: true,
      className: 'w-24 text-right whitespace-nowrap',
      // O grupo do sistema tem acesso a tudo e não é alterado por aqui.
      conteudo: (grupo) =>
        grupo.sistema ? (
          <span className="text-xs text-muted-foreground">Acesso total</span>
        ) : (
          <>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Alterar ${grupo.nome}`}
              onClick={() => setEmEdicao(grupo)}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={`Excluir ${grupo.nome}`}
              onClick={() => setExcluindo(grupo)}
            >
              <Trash2 />
            </Button>
          </>
        ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Grupos de acesso</h1>
          <p className="text-muted-foreground">
            Monte grupos com as telas que cada equipe precisa. Os grupos valem só nesta prefeitura.
          </p>
        </div>
        <Button onClick={() => setCadastrando(true)}>
          <Plus data-icon="inline-start" />
          Novo grupo
        </Button>
      </div>

      <Listagem
        chave="grupos"
        itens={grupos.data}
        carregando={grupos.isPending}
        erro={grupos.isError}
        colunas={colunas}
        identificador={(grupo) => grupo.id}
        placeholder="Buscar por nome…"
        vazio={{
          titulo: 'Nenhum grupo',
          descricao: 'Cadastre o primeiro em “Novo grupo”.',
          icone: <LockKeyhole />,
        }}
      />

      {cadastrando && <Formulario aoFechar={() => setCadastrando(false)} />}
      {emEdicao && <Formulario grupo={emEdicao} aoFechar={() => setEmEdicao(null)} />}
      <ConfirmarExclusao grupo={excluindo} aoFechar={() => setExcluindo(null)} />
    </div>
  )
}
