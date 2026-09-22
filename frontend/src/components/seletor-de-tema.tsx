import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'

/** Alterna entre o tema claro e o escuro. */
export function SeletorDeTema() {
  const { resolvedTheme, setTheme } = useTheme()
  const escuro = resolvedTheme === 'dark'
  const rotulo = escuro ? 'Mudar para o tema claro' : 'Mudar para o tema escuro'

  return (
    <Button
      variant="outline"
      size="icon"
      aria-label={rotulo}
      title={rotulo}
      onClick={() => setTheme(escuro ? 'light' : 'dark')}
    >
      <Sun className="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
      <Moon className="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
    </Button>
  )
}
