import { zodResolver } from '@hookform/resolvers/zod'
import { ImageUp } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { api } from '@/lib/api'
import { iniciais, type Usuario } from '@/lib/auth'
import { errosDosCampos } from '@/lib/empresas'

const SENHA_MINIMA = 8

const esquemaDados = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(150, 'Use no máximo 150 caracteres.'),
  email: z.email('Informe um e-mail válido.').max(150, 'Use no máximo 150 caracteres.'),
})

const esquemaSenha = z
  .object({
    senha_atual: z.string().min(1, 'Informe a senha atual.'),
    password: z.string().min(SENHA_MINIMA, `Mínimo de ${SENHA_MINIMA} caracteres.`),
    password_confirmation: z.string(),
  })
  .refine((campos) => campos.password === campos.password_confirmation, {
    path: ['password_confirmation'],
    message: 'As senhas não conferem.',
  })

/** Asterisco dos campos obrigatórios, como no restante do sistema. */
function Obrigatorio() {
  return (
    <span aria-hidden className="text-destructive">
      *
    </span>
  )
}

/** Envio e remoção da foto. Vale em todas as prefeituras, como o nome e o e-mail. */
function Foto({ usuario }: { usuario: Usuario }) {
  const queryClient = useQueryClient()
  const arquivo = useRef<HTMLInputElement>(null)

  const atualizar = (foto: string | null) => {
    queryClient.setQueryData(['me'], (atual?: Usuario) => (atual ? { ...atual, foto } : atual))
    queryClient.invalidateQueries({ queryKey: ['usuarios'] })
  }

  const enviar = useMutation({
    mutationFn: async (imagem: File) => {
      const dados = new FormData()
      dados.append('foto', imagem)
      return (await api.post<{ foto: string }>('/me/foto', dados)).data
    },
    onSuccess: ({ foto }) => {
      atualizar(foto)
      toast.success('Foto atualizada.')
    },
    onError: (erro) => toast.error(errosDosCampos(erro)?.foto ?? 'Não foi possível enviar a foto.'),
  })

  const remover = useMutation({
    mutationFn: () => api.delete('/me/foto'),
    onSuccess: () => {
      atualizar(null)
      toast.success('Foto removida.')
    },
    onError: () => toast.error('Não foi possível remover a foto.'),
  })

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-14 rounded-lg">
        {usuario.foto && <AvatarImage src={usuario.foto} alt="" className="rounded-lg" />}
        <AvatarFallback className="rounded-lg bg-marca text-lg text-marca-foreground">
          {iniciais(usuario.name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex flex-col items-start gap-1">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={enviar.isPending}
            onClick={() => arquivo.current?.click()}
          >
            {enviar.isPending ? <Spinner data-icon="inline-start" /> : <ImageUp />}
            Enviar foto
          </Button>
          {usuario.foto && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={remover.isPending}
              onClick={() => remover.mutate()}
            >
              Remover
            </Button>
          )}
        </div>
        <span className="text-xs text-muted-foreground">JPEG, PNG ou WebP, até 2 MB.</span>
      </div>
      <input
        ref={arquivo}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Foto"
        className="sr-only"
        onChange={(evento) => {
          const imagem = evento.target.files?.[0]
          evento.target.value = ''
          if (imagem) enviar.mutate(imagem)
        }}
      />
    </div>
  )
}

function MeusDados({ usuario, aoFechar }: { usuario: Usuario; aoFechar: () => void }) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.infer<typeof esquemaDados>>({
    resolver: zodResolver(esquemaDados),
    values: { name: usuario.name, email: usuario.email },
  })

  const salvar = useMutation({
    mutationFn: async (dados: z.infer<typeof esquemaDados>) =>
      (await api.put<Usuario>('/me', dados)).data,
    onSuccess: (atualizado) => {
      queryClient.setQueryData(['me'], atualizado)
      queryClient.invalidateQueries({ queryKey: ['usuarios'] })
      toast.success('Dados salvos.')
      aoFechar()
    },
    onError: (erro) => {
      const erros = errosDosCampos(erro)
      if (erros?.email) setError('email', { message: erros.email })
      else if (erros?.name) setError('name', { message: erros.name })
      else toast.error('Não foi possível salvar.')
    },
  })

  return (
    <form
      id="form-meus-dados"
      onSubmit={handleSubmit((dados) => salvar.mutate(dados))}
      noValidate
      className="flex flex-col gap-6"
    >
      <Foto usuario={usuario} />
      <FieldGroup>
        <Field data-invalid={errors.name ? true : undefined}>
          <FieldLabel htmlFor="name">
            Nome <Obrigatorio />
          </FieldLabel>
          <Input id="name" aria-invalid={errors.name ? true : undefined} {...register('name')} />
          <FieldError>{errors.name?.message}</FieldError>
        </Field>
        <Field data-invalid={errors.email ? true : undefined}>
          <FieldLabel htmlFor="email">
            E-mail <Obrigatorio />
          </FieldLabel>
          <Input
            id="email"
            type="email"
            aria-invalid={errors.email ? true : undefined}
            {...register('email')}
          />
          {errors.email ? (
            <FieldError>{errors.email.message}</FieldError>
          ) : (
            <FieldDescription>Para onde vai o link de recuperação de senha.</FieldDescription>
          )}
        </Field>
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={aoFechar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={salvar.isPending}>
          {salvar.isPending && <Spinner data-icon="inline-start" />}
          Salvar
        </Button>
      </DialogFooter>
    </form>
  )
}

function Senha({ aoFechar }: { aoFechar: () => void }) {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<z.infer<typeof esquemaSenha>>({
    resolver: zodResolver(esquemaSenha),
    defaultValues: { senha_atual: '', password: '', password_confirmation: '' },
  })

  const trocar = useMutation({
    mutationFn: async (dados: z.infer<typeof esquemaSenha>) =>
      (await api.put<{ message: string }>('/me/senha', dados)).data,
    onSuccess: ({ message }) => {
      toast.success(message)
      aoFechar()
    },
    onError: (erro) => {
      const erros = errosDosCampos(erro)
      if (erros?.senha_atual) setError('senha_atual', { message: erros.senha_atual })
      else if (erros?.password) setError('password', { message: erros.password })
      else toast.error('Não foi possível trocar a senha.')
    },
  })

  return (
    <form
      onSubmit={handleSubmit((dados) => trocar.mutate(dados))}
      noValidate
      className="flex flex-col gap-6"
    >
      <FieldGroup>
        <Field data-invalid={errors.senha_atual ? true : undefined}>
          <FieldLabel htmlFor="senha_atual">
            Senha atual <Obrigatorio />
          </FieldLabel>
          <Input
            id="senha_atual"
            type="password"
            autoComplete="current-password"
            aria-invalid={errors.senha_atual ? true : undefined}
            {...register('senha_atual')}
          />
          <FieldError>{errors.senha_atual?.message}</FieldError>
        </Field>
        <Field data-invalid={errors.password ? true : undefined}>
          <FieldLabel htmlFor="password">
            Nova senha <Obrigatorio />
          </FieldLabel>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            placeholder={`Mínimo de ${SENHA_MINIMA} caracteres`}
            aria-invalid={errors.password ? true : undefined}
            {...register('password')}
          />
          {errors.password ? (
            <FieldError>{errors.password.message}</FieldError>
          ) : (
            <FieldDescription>Mínimo de {SENHA_MINIMA} caracteres.</FieldDescription>
          )}
        </Field>
        <Field data-invalid={errors.password_confirmation ? true : undefined}>
          <FieldLabel htmlFor="password_confirmation">
            Confirmar nova senha <Obrigatorio />
          </FieldLabel>
          <Input
            id="password_confirmation"
            type="password"
            autoComplete="new-password"
            placeholder="Repita a nova senha"
            aria-invalid={errors.password_confirmation ? true : undefined}
            {...register('password_confirmation')}
          />
          <FieldError>{errors.password_confirmation?.message}</FieldError>
        </Field>
      </FieldGroup>
      <p className="text-sm text-muted-foreground">
        Ao trocar a senha, as suas outras sessões são encerradas — esta continua ativa.
      </p>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={aoFechar}>
          Cancelar
        </Button>
        <Button type="submit" disabled={trocar.isPending}>
          {trocar.isPending && <Spinner data-icon="inline-start" />}
          Trocar senha
        </Button>
      </DialogFooter>
    </form>
  )
}

/** Dados do próprio usuário e troca de senha, abertos pelo menu do rodapé. */
export function MinhaConta({ usuario, aoFechar }: { usuario: Usuario; aoFechar: () => void }) {
  const [aba, setAba] = useState('dados')

  return (
    <Dialog open onOpenChange={(abrir) => !abrir && aoFechar()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Minha conta</DialogTitle>
          <DialogDescription>
            Foto, nome e e-mail valem em todas as prefeituras em que você trabalha.
          </DialogDescription>
        </DialogHeader>
        <Tabs value={aba} onValueChange={setAba}>
          <TabsList className="w-full">
            <TabsTrigger value="dados">Meus dados</TabsTrigger>
            <TabsTrigger value="senha">Senha</TabsTrigger>
          </TabsList>
          <TabsContent value="dados" className="pt-4">
            <MeusDados usuario={usuario} aoFechar={aoFechar} />
          </TabsContent>
          <TabsContent value="senha" className="pt-4">
            <Senha aoFechar={aoFechar} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
