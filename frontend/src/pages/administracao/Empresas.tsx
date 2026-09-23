import { zodResolver } from '@hookform/resolvers/zod'
import { Building2, CircleAlert, Plus } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Listagem, type Coluna } from '@/components/listagem'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { cnpjValido, formatarCnpj, normalizarCnpj } from '@/lib/cnpj'
import { cpfValido, formatarCpf, somenteDigitos } from '@/lib/cpf'
import { errosDosCampos, useCadastrarEmpresa, useEmpresas, type Empresa } from '@/lib/empresas'
import { DOMINIO_CENTRAL } from '@/lib/prefeitura'

const esquema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.').max(150, 'Use no máximo 150 caracteres.'),
  cnpj: z.string().refine(cnpjValido, 'Informe um CNPJ válido.'),
  subdominio: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Informe o endereço.')
    .max(40, 'Use no máximo 40 caracteres.')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use apenas letras minúsculas, números e hífen.'),
  administrador: z.object({
    cpf: z.string().refine(cpfValido, 'Informe um CPF válido.'),
    email: z.email('Informe um e-mail válido.').max(150, 'Use no máximo 150 caracteres.'),
    senha: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.'),
  }),
})

type Campos = z.infer<typeof esquema>

function NovaEmpresa() {
  const [aberto, setAberto] = useState(false)
  const cadastrar = useCadastrarEmpresa()
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<Campos>({ resolver: zodResolver(esquema) })
  const campoCnpj = register('cnpj')
  const campoCpf = register('administrador.cpf')
  const campoSubdominio = register('subdominio')
  // Só para mostrar o nome do usuário que será criado (admin_<subdominio>).
  const [subdominio, setSubdominio] = useState('')

  const salvar = handleSubmit((dados) =>
    cadastrar.mutate(
      {
        ...dados,
        cnpj: normalizarCnpj(dados.cnpj),
        administrador: {
          ...dados.administrador,
          cpf: somenteDigitos(dados.administrador.cpf),
        },
      },
      {
        onSuccess: (empresa) => {
          toast.success(
            `${empresa.nome} cadastrada. O banco de dados está sendo criado e o administrador já pode entrar.`,
          )
          setAberto(false)
          reset()
        },
        onError: (erro) => {
          for (const [campo, mensagem] of Object.entries(errosDosCampos(erro) ?? {})) {
            // `administrador.email` e companhia também são campos do formulário.
            if (campo in esquema.shape || campo.startsWith('administrador.')) {
              setError(campo as keyof Campos, { message: mensagem })
            }
          }
        },
      },
    ),
  )

  const erroGeral = cadastrar.isError && !errosDosCampos(cadastrar.error)

  return (
    <Dialog
      open={aberto}
      onOpenChange={(abrir) => {
        setAberto(abrir)
        if (!abrir) {
          reset()
          cadastrar.reset()
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus data-icon="inline-start" />
          Nova empresa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova empresa</DialogTitle>
          <DialogDescription>
            Cria a prefeitura no endereço informado, com banco de dados próprio e os grupos de
            acesso Parâmetros, Tabelas e Lançamentos.
          </DialogDescription>
        </DialogHeader>
        {erroGeral && (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>Não foi possível cadastrar. Tente novamente.</AlertDescription>
          </Alert>
        )}
        <form id="form-empresa" onSubmit={salvar} noValidate>
          <FieldGroup>
            <Field data-invalid={errors.nome ? true : undefined}>
              <FieldLabel htmlFor="nome">Nome</FieldLabel>
              <Input
                id="nome"
                placeholder="Prefeitura Municipal de …"
                aria-invalid={errors.nome ? true : undefined}
                {...register('nome')}
              />
              <FieldError>{errors.nome?.message}</FieldError>
            </Field>
            <Field data-invalid={errors.cnpj ? true : undefined}>
              <FieldLabel htmlFor="cnpj">CNPJ</FieldLabel>
              <Input
                id="cnpj"
                placeholder="00.000.000/0000-00"
                maxLength={18}
                autoComplete="off"
                aria-invalid={errors.cnpj ? true : undefined}
                {...campoCnpj}
                onChange={(evento) => {
                  evento.target.value = formatarCnpj(evento.target.value)
                  return campoCnpj.onChange(evento)
                }}
              />
              <FieldError>{errors.cnpj?.message}</FieldError>
            </Field>
            <Field data-invalid={errors.subdominio ? true : undefined}>
              <FieldLabel htmlFor="subdominio">Endereço</FieldLabel>
              <InputGroup>
                <InputGroupInput
                  id="subdominio"
                  placeholder="nome-do-municipio"
                  autoComplete="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  aria-invalid={errors.subdominio ? true : undefined}
                  {...campoSubdominio}
                  onChange={(evento) => {
                    setSubdominio(evento.target.value.trim().toLowerCase().replace(/-/g, '_'))
                    return campoSubdominio.onChange(evento)
                  }}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>.{DOMINIO_CENTRAL}</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              {errors.subdominio ? (
                <FieldError>{errors.subdominio.message}</FieldError>
              ) : (
                <FieldDescription>
                  É o endereço que você vai repassar aos usuários da prefeitura. Não pode ser
                  alterado depois.
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="administrador-cpf">Administrador da prefeitura</FieldLabel>
              <FieldDescription>
                Cria o usuário <span className="font-mono">admin_{subdominio || '…'}</span>, no
                grupo Administrador, com acesso a todas as telas. Se o CPF já existir no STM, o
                usuário atual é aproveitado.
              </FieldDescription>
            </Field>
            <Field data-invalid={errors.administrador?.cpf ? true : undefined}>
              <FieldLabel htmlFor="administrador-cpf">CPF</FieldLabel>
              <Input
                id="administrador-cpf"
                inputMode="numeric"
                placeholder="000.000.000-00"
                maxLength={14}
                autoComplete="off"
                aria-invalid={errors.administrador?.cpf ? true : undefined}
                {...campoCpf}
                onChange={(evento) => {
                  evento.target.value = formatarCpf(evento.target.value)
                  return campoCpf.onChange(evento)
                }}
              />
              <FieldError>{errors.administrador?.cpf?.message}</FieldError>
            </Field>
            <Field data-invalid={errors.administrador?.email ? true : undefined}>
              <FieldLabel htmlFor="administrador-email">E-mail</FieldLabel>
              <Input
                id="administrador-email"
                type="email"
                autoComplete="off"
                aria-invalid={errors.administrador?.email ? true : undefined}
                {...register('administrador.email')}
              />
              <FieldError>{errors.administrador?.email?.message}</FieldError>
            </Field>
            <Field data-invalid={errors.administrador?.senha ? true : undefined}>
              <FieldLabel htmlFor="administrador-senha">Senha inicial</FieldLabel>
              <Input
                id="administrador-senha"
                type="password"
                autoComplete="new-password"
                aria-invalid={errors.administrador?.senha ? true : undefined}
                {...register('administrador.senha')}
              />
              {errors.administrador?.senha ? (
                <FieldError>{errors.administrador.senha.message}</FieldError>
              ) : (
                <FieldDescription>
                  Ao menos 8 caracteres. Ele pode trocar depois em Minha conta.
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
        </form>
        <DialogFooter>
          <Button type="submit" form="form-empresa" disabled={cadastrar.isPending}>
            {cadastrar.isPending && <Spinner data-icon="inline-start" />}
            Cadastrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Situacao({ situacao }: { situacao: Empresa['situacao'] }) {
  if (situacao === 'ativa') return <Badge variant="secondary">Ativa</Badge>
  return (
    <Badge variant="outline">
      <Spinner />
      Provisionando
    </Badge>
  )
}

const data = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

const colunas: Coluna<Empresa>[] = [
  {
    id: 'nome',
    titulo: 'Nome',
    className: 'font-medium',
    conteudo: (empresa) => empresa.nome ?? empresa.id,
    busca: (empresa) => `${empresa.nome ?? ''} ${empresa.id}`,
  },
  {
    id: 'cnpj',
    titulo: 'CNPJ',
    className: 'font-mono text-xs',
    conteudo: (empresa) => (empresa.cnpj ? formatarCnpj(empresa.cnpj) : '—'),
    busca: (empresa) => (empresa.cnpj ? `${empresa.cnpj} ${formatarCnpj(empresa.cnpj)}` : ''),
  },
  {
    id: 'dominio',
    titulo: 'Endereço',
    className: 'font-mono text-xs',
    conteudo: (empresa) => empresa.dominio ?? '—',
    busca: (empresa) => empresa.dominio,
  },
  {
    id: 'situacao',
    titulo: 'Situação',
    conteudo: (empresa) => <Situacao situacao={empresa.situacao} />,
  },
  {
    id: 'criada_em',
    titulo: 'Cadastrada em',
    className: 'text-right text-muted-foreground',
    conteudo: (empresa) => (empresa.criada_em ? data.format(new Date(empresa.criada_em)) : '—'),
  },
]

export default function Empresas() {
  const empresas = useEmpresas()
  const [situacoes, setSituacoes] = useState<Empresa['situacao'][]>([])

  const filtradas = situacoes.length
    ? empresas.data?.filter((empresa) => situacoes.includes(empresa.situacao))
    : empresas.data

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight">Empresas</h1>
          <p className="text-muted-foreground">
            Prefeituras clientes do STM. Cada uma tem endereço e banco de dados próprios.
          </p>
        </div>
        <NovaEmpresa />
      </div>

      <Listagem
        chave="empresas"
        itens={filtradas}
        carregando={empresas.isPending}
        erro={empresas.isError}
        colunas={colunas}
        identificador={(empresa) => empresa.id}
        placeholder="Buscar por nome, CNPJ ou endereço…"
        filtrosAtivos={situacoes.length}
        aoLimparFiltros={() => setSituacoes([])}
        filtros={(['ativa', 'provisionando'] as const).map((situacao) => (
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
            {situacao === 'ativa' ? 'Ativa' : 'Provisionando'}
          </DropdownMenuCheckboxItem>
        ))}
        vazio={{
          titulo: 'Nenhuma empresa cadastrada',
          descricao: 'Cadastre a primeira em “Nova empresa”.',
          icone: <Building2 />,
        }}
      />
    </div>
  )
}
