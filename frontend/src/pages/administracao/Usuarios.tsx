import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Power, PowerOff, Trash2, Users, UsersRound } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Listagem, type Coluna } from '@/components/listagem'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { useUsuario } from '@/lib/auth'
import { cpfValido, formatarCpf, somenteDigitos } from '@/lib/cpf'
import { errosDosCampos } from '@/lib/empresas'
import { useGrupos } from '@/lib/grupos'
import {
  useAlterarStatus,
  useAlterarUsuario,
  useAlterarVinculos,
  useCadastrarUsuario,
  useRemoverUsuario,
  useUsuariosDaPrefeitura,
  type UsuarioDaPrefeitura,
} from '@/lib/usuarios'

const SENHA_MINIMA = 8

function esquemaDo(usuario?: UsuarioDaPrefeitura) {
  return z.object({
    name: z.string().trim().min(1, 'Informe o nome.').max(150, 'Use no máximo 150 caracteres.'),
    cpf: usuario ? z.string().optional() : z.string().refine(cpfValido, 'Informe um CPF válido.'),
    email: z.email('Informe um e-mail válido.').max(150, 'Use no máximo 150 caracteres.'),
    password: usuario
      ? z
          .string()
          .refine(
            (senha) => senha === '' || senha.length >= SENHA_MINIMA,
            `A senha deve ter ao menos ${SENHA_MINIMA} caracteres.`,
          )
      : z.string().min(SENHA_MINIMA, `A senha deve ter ao menos ${SENHA_MINIMA} caracteres.`),
  })
}

type Campos = z.infer<ReturnType<typeof esquemaDo>>

/** `usuario` ausente: cadastro. Presente: alteração. */
function Formulario({
  usuario,
  aberto,
  aoFechar,
}: {
  usuario?: UsuarioDaPrefeitura
  aberto: boolean
  aoFechar: () => void
}) {
  const grupos = useGrupos()
  const cadastrar = useCadastrarUsuario()
  const alterar = useAlterarUsuario(usuario?.id ?? 0)
  const salvamento = usuario ? alterar : cadastrar
  const somenteGrupos = usuario?.somente_grupos ?? false

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<Campos>({
    resolver: zodResolver(esquemaDo(usuario)),
    values: {
      name: usuario?.name ?? '',
      cpf: usuario?.cpf ? formatarCpf(usuario.cpf) : '',
      email: usuario?.email ?? '',
      password: '',
    },
  })
  const campoCpf = register('cpf')
  const [selecionados, setSelecionados] = useState<string[]>(usuario?.grupos ?? [])

  const aoErrar = (erro: unknown) => {
    for (const [campo, mensagem] of Object.entries(errosDosCampos(erro) ?? {})) {
      const conhecido = ['name', 'cpf', 'email', 'password'].includes(campo)
      if (conhecido) setError(campo as keyof Campos, { message: mensagem })
      else toast.error(mensagem)
    }
  }

  const salvar = handleSubmit((dados) => {
    const comum = {
      name: dados.name,
      email: dados.email,
      ...(dados.password ? { password: dados.password } : {}),
    }

    if (usuario) {
      alterar.mutate(comum, {
        onSuccess: () => {
          toast.success('Usuário alterado.')
          aoFechar()
        },
        onError: aoErrar,
      })
      return
    }

    cadastrar.mutate(
      {
        ...comum,
        cpf: somenteDigitos(dados.cpf ?? ''),
        password: dados.password,
        grupos: selecionados,
      },
      {
        onSuccess: (novo) => {
          toast.success(
            novo.vinculado
              ? `${novo.name} já tinha cadastro no STM e agora tem acesso a esta prefeitura. O nome e a senha atuais foram mantidos.`
              : 'Usuário cadastrado.',
          )
          aoFechar()
        },
        onError: aoErrar,
      },
    )
  })

  return (
    <Dialog open={aberto} onOpenChange={(abrir) => !abrir && aoFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{usuario ? 'Alterar usuário' : 'Novo usuário'}</DialogTitle>
          <DialogDescription>
            {somenteGrupos
              ? 'Este usuário também trabalha em outra prefeitura: nome, e-mail e senha são dele, e só mudam onde foi cadastrado. Use “Editar vínculos” para os grupos.'
              : usuario
                ? 'Os grupos ficam em “Editar vínculos”.'
                : 'Os grupos valem só nesta prefeitura.'}
          </DialogDescription>
        </DialogHeader>
        <form id="form-usuario" onSubmit={salvar} noValidate>
          <FieldGroup>
            <Field data-invalid={errors.name ? true : undefined}>
              <FieldLabel htmlFor="name">Nome</FieldLabel>
              <Input
                id="name"
                disabled={somenteGrupos}
                aria-invalid={errors.name ? true : undefined}
                {...register('name')}
              />
              <FieldError>{errors.name?.message}</FieldError>
            </Field>
            {!usuario && (
              <Field data-invalid={errors.cpf ? true : undefined}>
                <FieldLabel htmlFor="cpf">CPF</FieldLabel>
                <Input
                  id="cpf"
                  inputMode="numeric"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  autoComplete="off"
                  aria-invalid={errors.cpf ? true : undefined}
                  {...campoCpf}
                  onChange={(evento) => {
                    evento.target.value = formatarCpf(evento.target.value)
                    return campoCpf.onChange(evento)
                  }}
                />
                {errors.cpf ? (
                  <FieldError>{errors.cpf.message}</FieldError>
                ) : (
                  <FieldDescription>
                    É o login. Se o CPF já existir no STM, o usuário passa a ter acesso a esta
                    prefeitura, mantendo nome e senha.
                  </FieldDescription>
                )}
              </Field>
            )}
            <Field data-invalid={errors.email ? true : undefined}>
              <FieldLabel htmlFor="email">E-mail</FieldLabel>
              <Input
                id="email"
                type="email"
                autoComplete="off"
                disabled={somenteGrupos}
                aria-invalid={errors.email ? true : undefined}
                {...register('email')}
              />
              <FieldError>{errors.email?.message}</FieldError>
            </Field>
            <Field data-invalid={errors.password ? true : undefined}>
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <Input
                id="password"
                type="password"
                autoComplete="new-password"
                disabled={somenteGrupos}
                aria-invalid={errors.password ? true : undefined}
                {...register('password')}
              />
              {errors.password ? (
                <FieldError>{errors.password.message}</FieldError>
              ) : (
                usuario && <FieldDescription>Deixe em branco para manter a atual.</FieldDescription>
              )}
            </Field>
            {!usuario && (
              <Field>
                <FieldLabel htmlFor="grupos">Grupos de acesso</FieldLabel>
                <div id="grupos" className="flex flex-col gap-3">
                  {grupos.data?.length === 0 && (
                    <FieldDescription>Esta prefeitura ainda não tem grupos.</FieldDescription>
                  )}
                  {grupos.data?.map(({ id, nome }) => (
                    <label key={id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={selecionados.includes(nome)}
                        onCheckedChange={(marcado) =>
                          setSelecionados((atuais) =>
                            marcado ? [...atuais, nome] : atuais.filter((atual) => atual !== nome),
                          )
                        }
                      />
                      {nome}
                    </label>
                  ))}
                </div>
                <FieldDescription>
                  Sem grupo, o usuário entra na prefeitura mas vê apenas o Início. Depois, use
                  “Editar vínculos”.
                </FieldDescription>
              </Field>
            )}
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="submit" form="form-usuario" disabled={salvamento.isPending}>
            {salvamento.isPending && <Spinner data-icon="inline-start" />}
            {usuario ? 'Salvar' : 'Cadastrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Grupos do usuário nesta prefeitura. */
function EditarVinculos({
  usuario,
  aoFechar,
}: {
  usuario: UsuarioDaPrefeitura
  aoFechar: () => void
}) {
  const grupos = useGrupos()
  const salvar = useAlterarVinculos(usuario.id)
  const [selecionados, setSelecionados] = useState<string[]>(usuario.grupos)

  return (
    <Dialog open onOpenChange={(abrir) => !abrir && aoFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar vínculos</DialogTitle>
          <DialogDescription>
            Grupos de {usuario.name} nesta prefeitura. Eles definem as telas que ele enxerga.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          {grupos.data?.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Esta prefeitura ainda não tem grupos. Cadastre em Administração › Grupos de acesso.
            </p>
          )}
          {grupos.data?.map(({ id, nome, telas }) => (
            <label key={id} className="flex items-start gap-2 text-sm">
              <Checkbox
                className="mt-0.5"
                checked={selecionados.includes(nome)}
                onCheckedChange={(marcado) =>
                  setSelecionados((atuais) =>
                    marcado ? [...atuais, nome] : atuais.filter((atual) => atual !== nome),
                  )
                }
              />
              <span className="flex flex-col">
                {nome}
                <span className="text-xs text-muted-foreground">{telas.length} tela(s)</span>
              </span>
            </label>
          ))}
          <p className="text-sm text-muted-foreground">
            Sem grupo, o usuário entra na prefeitura mas vê apenas o Início.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button
            disabled={salvar.isPending}
            onClick={() =>
              salvar.mutate(selecionados, {
                onSuccess: () => {
                  toast.success(`Vínculos de ${usuario.name} atualizados.`)
                  aoFechar()
                },
                onError: () => toast.error('Não foi possível salvar os vínculos.'),
              })
            }
          >
            {salvar.isPending && <Spinner data-icon="inline-start" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmarDesativacao({
  usuario,
  aoFechar,
}: {
  usuario: UsuarioDaPrefeitura | null
  aoFechar: () => void
}) {
  const status = useAlterarStatus()

  return (
    <Dialog open={usuario !== null} onOpenChange={(abrir) => !abrir && aoFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Desativar acesso</DialogTitle>
          <DialogDescription>
            {usuario?.name} deixa de entrar nesta prefeitura e as sessões abertas aqui são
            encerradas. O cadastro e os grupos são mantidos, e o acesso pode ser reativado a
            qualquer momento.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            disabled={status.isPending}
            onClick={() =>
              usuario &&
              status.mutate(
                { id: usuario.id, ativo: false },
                {
                  onSuccess: () => {
                    toast.success(`Acesso de ${usuario.name} desativado.`)
                    aoFechar()
                  },
                  onError: (erro) => {
                    const erros = errosDosCampos(erro)
                    toast.error(erros?.usuario ?? 'Não foi possível desativar o acesso.')
                  },
                },
              )
            }
          >
            {status.isPending && <Spinner data-icon="inline-start" />}
            Desativar acesso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ConfirmarRemocao({
  usuario,
  aoFechar,
}: {
  usuario: UsuarioDaPrefeitura | null
  aoFechar: () => void
}) {
  const remover = useRemoverUsuario()

  return (
    <Dialog open={usuario !== null} onOpenChange={(abrir) => !abrir && aoFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover acesso</DialogTitle>
          <DialogDescription>
            {usuario?.name} perde o acesso a esta prefeitura e as sessões abertas dele aqui são
            encerradas. O cadastro continua no STM, nas outras prefeituras em que ele trabalha.
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
              usuario &&
              remover.mutate(usuario.id, {
                onSuccess: () => {
                  toast.success(`${usuario.name} não tem mais acesso a esta prefeitura.`)
                  aoFechar()
                },
                onError: (erro) => {
                  const erros = errosDosCampos(erro)
                  toast.error(erros?.usuario ?? 'Não foi possível remover o acesso.')
                },
              })
            }
          >
            {remover.isPending && <Spinner data-icon="inline-start" />}
            Remover acesso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function Usuarios() {
  const usuarios = useUsuariosDaPrefeitura()
  const eu = useUsuario()
  const [emEdicao, setEmEdicao] = useState<UsuarioDaPrefeitura | null>(null)
  const [cadastrando, setCadastrando] = useState(false)
  const [removendo, setRemovendo] = useState<UsuarioDaPrefeitura | null>(null)
  const [desativando, setDesativando] = useState<UsuarioDaPrefeitura | null>(null)
  const [emVinculos, setEmVinculos] = useState<UsuarioDaPrefeitura | null>(null)
  const [situacoes, setSituacoes] = useState<('ativo' | 'inativo')[]>([])
  const status = useAlterarStatus()

  const filtrados = situacoes.length
    ? usuarios.data?.filter((usuario) => situacoes.includes(usuario.ativo ? 'ativo' : 'inativo'))
    : usuarios.data

  const colunas: Coluna<UsuarioDaPrefeitura>[] = [
    {
      id: 'nome',
      titulo: 'Nome',
      className: 'font-medium',
      conteudo: (usuario) => (
        <>
          {usuario.name}
          {usuario.superadmin && (
            <Badge variant="outline" className="ml-2">
              Superadmin
            </Badge>
          )}
        </>
      ),
      busca: (usuario) => usuario.name,
    },
    {
      id: 'cpf',
      titulo: 'CPF',
      className: 'font-mono text-xs',
      conteudo: (usuario) => (usuario.cpf ? formatarCpf(usuario.cpf) : '—'),
      busca: (usuario) => (usuario.cpf ? `${usuario.cpf} ${formatarCpf(usuario.cpf)}` : ''),
    },
    {
      id: 'email',
      titulo: 'E-mail',
      className: 'text-muted-foreground',
      conteudo: (usuario) => usuario.email,
      busca: (usuario) => usuario.email,
    },
    {
      id: 'grupos',
      titulo: 'Grupos',
      conteudo: (usuario) => (
        <div className="flex flex-wrap gap-1">
          {usuario.grupos.length === 0 ? (
            <span className="text-muted-foreground">—</span>
          ) : (
            usuario.grupos.map((grupo) => (
              <Badge key={grupo} variant="secondary">
                {grupo}
              </Badge>
            ))
          )}
        </div>
      ),
      busca: (usuario) => usuario.grupos.join(' '),
    },
    {
      id: 'situacao',
      titulo: 'Situação',
      conteudo: (usuario) =>
        usuario.ativo ? (
          <Badge variant="secondary">Ativo</Badge>
        ) : (
          <Badge variant="outline">Inativo</Badge>
        ),
    },
    {
      id: 'acoes',
      titulo: 'Ações',
      fixa: true,
      className: 'w-40 text-right whitespace-nowrap',
      conteudo: (usuario) => (
        <>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Alterar ${usuario.name}`}
            onClick={() => setEmEdicao(usuario)}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Editar vínculos de ${usuario.name}`}
            title="Editar vínculos"
            onClick={() => setEmVinculos(usuario)}
          >
            <UsersRound />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${usuario.ativo ? 'Desativar' : 'Ativar'} ${usuario.name}`}
            disabled={usuario.id === eu.data?.id || status.isPending}
            onClick={() => {
              if (usuario.ativo) {
                setDesativando(usuario)
                return
              }
              status.mutate(
                { id: usuario.id, ativo: true },
                {
                  onSuccess: () => toast.success(`Acesso de ${usuario.name} ativado.`),
                  onError: () => toast.error('Não foi possível ativar o acesso.'),
                },
              )
            }}
          >
            {usuario.ativo ? <PowerOff /> : <Power />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Remover ${usuario.name}`}
            disabled={usuario.id === eu.data?.id}
            onClick={() => setRemovendo(usuario)}
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
          <h1 className="text-2xl font-semibold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Quem tem acesso a esta prefeitura e o que cada um pode abrir.
          </p>
        </div>
        <Button onClick={() => setCadastrando(true)}>
          <Plus data-icon="inline-start" />
          Novo usuário
        </Button>
      </div>

      <Listagem
        chave="usuarios"
        itens={filtrados}
        carregando={usuarios.isPending}
        erro={usuarios.isError}
        colunas={colunas}
        identificador={(usuario) => usuario.id}
        placeholder="Buscar por nome, CPF, e-mail ou grupo…"
        filtrosAtivos={situacoes.length}
        aoLimparFiltros={() => setSituacoes([])}
        filtros={(['ativo', 'inativo'] as const).map((situacao) => (
          <DropdownMenuCheckboxItem
            key={situacao}
            checked={situacoes.includes(situacao)}
            onCheckedChange={(marcado) =>
              setSituacoes((atuais) =>
                marcado ? [...atuais, situacao] : atuais.filter((atual) => atual !== situacao),
              )
            }
            onSelect={(evento) => evento.preventDefault()}
          >
            {situacao === 'ativo' ? 'Ativos' : 'Inativos'}
          </DropdownMenuCheckboxItem>
        ))}
        aoDestacar={(usuario) => (usuario.ativo ? undefined : 'opacity-60')}
        vazio={{
          titulo: 'Nenhum usuário',
          descricao: 'Cadastre o primeiro em “Novo usuário”.',
          icone: <Users />,
        }}
      />

      {cadastrando && <Formulario aberto aoFechar={() => setCadastrando(false)} />}
      {emEdicao && <Formulario usuario={emEdicao} aberto aoFechar={() => setEmEdicao(null)} />}
      {emVinculos && <EditarVinculos usuario={emVinculos} aoFechar={() => setEmVinculos(null)} />}
      <ConfirmarDesativacao usuario={desativando} aoFechar={() => setDesativando(null)} />
      <ConfirmarRemocao usuario={removendo} aoFechar={() => setRemovendo(null)} />
    </div>
  )
}
