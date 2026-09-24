import type { FormEventHandler, ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'

/**
 * Moldura dos formulários de inclusão: diálogo, formulário e rodapé com Cancelar e Cadastrar.
 * A tela só declara os campos (`children`) e o envio.
 */
export function DialogoDeCadastro({
  id,
  titulo,
  descricao,
  salvando,
  aoEnviar,
  aoFechar,
  largo = false,
  children,
}: {
  /** Liga o botão Cadastrar ao formulário. */
  id: string
  titulo: string
  descricao: string
  salvando: boolean
  aoEnviar: FormEventHandler<HTMLFormElement>
  aoFechar: () => void
  largo?: boolean
  children: ReactNode
}) {
  return (
    <Dialog open onOpenChange={(abrir) => !abrir && aoFechar()}>
      <DialogContent className={largo ? 'max-h-[90svh] overflow-y-auto sm:max-w-2xl' : undefined}>
        <DialogHeader>
          <DialogTitle>{titulo}</DialogTitle>
          <DialogDescription>{descricao}</DialogDescription>
        </DialogHeader>
        <form id={id} onSubmit={aoEnviar} noValidate>
          <FieldGroup>{children}</FieldGroup>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button type="submit" form={id} disabled={salvando}>
            {salvando && <Spinner data-icon="inline-start" />}
            Cadastrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
