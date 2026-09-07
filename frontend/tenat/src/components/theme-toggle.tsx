import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from '@/theme/theme-provider'
import { Button } from '@/components/ui/button'

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className={className}>
      <div className="flex items-center gap-0.5 rounded-lg border border-border bg-background/80 p-0.5 shadow-sm backdrop-blur">
        <Button
          type="button"
          size="icon-sm"
          variant={isDark ? 'ghost' : 'secondary'}
          aria-label="Light mode"
          aria-pressed={!isDark}
          onClick={() => setTheme('light')}
        >
          <SunIcon className="size-4" />
        </Button>
        <Button
          type="button"
          size="icon-sm"
          variant={isDark ? 'secondary' : 'ghost'}
          aria-label="Dark mode"
          aria-pressed={isDark}
          onClick={() => setTheme('dark')}
        >
          <MoonIcon className="size-4" />
        </Button>
      </div>
    </div>
  )
}
