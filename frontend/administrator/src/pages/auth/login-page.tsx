import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  Building2,
  Compass,
  GraduationCap,
  Mail,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { toast } from 'sonner'
import { Field } from '@/components/field'
import { PasswordInput } from '@/components/password-input'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { APP_HOME, APP_ROLE, errorMessage, roleFrom, useAuth } from '@/lib/auth'
import { cn } from '@/lib/utils'

const FEATURES = [
  {
    title: 'Students',
    description: 'Learn smarter with AI guidance.',
    icon: GraduationCap,
    tone: 'text-sky-600 dark:text-sky-300',
    surface: 'bg-sky-500/10 dark:bg-sky-400/15',
  },
  {
    title: 'Teachers',
    description: 'Teach better with intelligent tools.',
    icon: UserRound,
    tone: 'text-violet-600 dark:text-violet-300',
    surface: 'bg-violet-500/10 dark:bg-violet-400/15',
  },
  {
    title: 'Institutions',
    description: 'Manage with AI-driven solutions.',
    icon: Building2,
    tone: 'text-indigo-600 dark:text-indigo-300',
    surface: 'bg-indigo-500/10 dark:bg-indigo-400/15',
  },
  {
    title: 'Assessments',
    description: 'AI-powered tests and insights.',
    icon: BarChart3,
    tone: 'text-cyan-600 dark:text-cyan-300',
    surface: 'bg-cyan-500/10 dark:bg-cyan-400/15',
  },
  {
    title: 'Career Guidance',
    description: 'Discover the right career path.',
    icon: Compass,
    tone: 'text-fuchsia-600 dark:text-fuchsia-300',
    surface: 'bg-fuchsia-500/10 dark:bg-fuchsia-400/15',
  },
  {
    title: 'Digital Content',
    description: 'High-quality learning content powered by AI.',
    icon: BookOpen,
    tone: 'text-blue-600 dark:text-blue-300',
    surface: 'bg-blue-500/10 dark:bg-blue-400/15',
  },
] as const

function MicrosoftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 21 21" aria-hidden>
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  )
}

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary dark:bg-primary/20">
        <Sparkles className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="text-base font-semibold tracking-tight text-foreground">Taleem AI</p>
        <p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          AI for the future of education
        </p>
      </div>
    </div>
  )
}

function BrandPanel({ className }: { className?: string }) {
  return (
    <section className={cn('portal-hero relative overflow-hidden', className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 size-[22rem] rounded-full bg-[radial-gradient(circle,rgb(12_60_255_/_0.18),transparent_68%)] dark:bg-[radial-gradient(circle,rgb(99_102_241_/_0.28),transparent_68%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/4 -right-10 size-72 rounded-full bg-[radial-gradient(circle,rgb(124_58_237_/_0.12),transparent_70%)] blur-2xl dark:bg-[radial-gradient(circle,rgb(167_139_250_/_0.18),transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-[linear-gradient(90deg,transparent,rgb(12_60_255_/_0.06),transparent)] dark:bg-[linear-gradient(90deg,transparent,rgb(99_102_241_/_0.12),transparent)]"
      />

      <div className="relative flex h-full flex-col justify-between gap-10 p-8 sm:p-10 lg:p-12">
        <div className="flex items-start justify-between gap-4">
          <BrandMark />
          <p className="hidden text-xs font-medium tracking-wide text-muted-foreground lg:block">
            Simple · Smart · Scalable
          </p>
        </div>

        <div className="max-w-xl">
          <h1 className="text-[2rem] leading-[1.15] font-semibold tracking-tight text-foreground sm:text-[2.5rem] lg:text-[2.75rem]">
            Building Pakistan’s AI-powered{' '}
            <span className="text-brand-gradient">education ecosystem</span> for students, teachers
            and institutions.
          </h1>

          <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="rounded-[var(--radius)] border border-border/70 bg-card/70 p-3.5 backdrop-blur-sm dark:bg-card/40"
              >
                <span
                  className={cn(
                    'mb-3 inline-flex size-9 items-center justify-center rounded-lg',
                    feature.surface,
                    feature.tone,
                  )}
                >
                  <feature.icon className="size-4" />
                </span>
                <p className="text-sm font-semibold text-foreground">{feature.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="max-w-md text-sm text-muted-foreground">
          Transforming education through the power of{' '}
          <span className="text-brand-gradient font-semibold">Artificial Intelligence</span>.
        </p>
      </div>
    </section>
  )
}

function LoginCard({
  email,
  password,
  remember,
  busy,
  onEmailChange,
  onPasswordChange,
  onRememberChange,
  onSubmit,
}: {
  email: string
  password: string
  remember: boolean
  busy: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onRememberChange: (value: boolean) => void
  onSubmit: () => void
}) {
  return (
    <div className="w-full max-w-[420px]">
      <div className="portal-card space-y-6 p-6 sm:p-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Welcome back</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Sign in to your TaleemAI CMS account.</p>
        </div>

        <div className="space-y-4">
          <Field label="Email">
            <div className="relative">
              <Input
                type="email"
                autoComplete="username"
                placeholder="name@yourorganization.com"
                value={email}
                className="h-10 pr-9"
                onChange={(e) => onEmailChange(e.target.value)}
              />
              <Mail className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </Field>

          <Field label="Password">
            <PasswordInput
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              className="h-10"
              onChange={(e) => onPasswordChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onSubmit()
              }}
            />
          </Field>

          <div className="flex items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox
                checked={remember}
                onCheckedChange={(checked) => onRememberChange(checked === true)}
              />
              Remember me
            </label>
            <button
              type="button"
              className="text-sm font-medium text-primary hover:underline"
              onClick={() => toast.message('Ask a platform administrator to reset your password.')}
            >
              Forgot password?
            </button>
          </div>

          <Button
            className="login-continue h-11 w-full text-sm font-semibold"
            loading={busy}
            disabled={!email || !password}
            onClick={onSubmit}
          >
            Continue →
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full gap-2 border-border bg-background text-foreground"
          onClick={() => toast.message('Microsoft sign-in is not configured for this portal yet.')}
        >
          <MicrosoftIcon className="size-4" />
          Sign in with Microsoft
        </Button>
      </div>

      <p className="mt-5 text-center text-sm text-muted-foreground">
        New to TaleemAI CMS?{' '}
        <button
          type="button"
          className="font-semibold text-foreground hover:text-primary hover:underline"
          onClick={() => toast.message('Contact your platform administrator for access.')}
        >
          Contact your administrator.
        </button>
      </p>
    </div>
  )
}

export function LoginPage() {
  const navigate = useNavigate()
  const { login, signOut } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [busy, setBusy] = useState(false)

  async function submit() {
    setBusy(true)
    try {
      const session = await login(email.trim(), password)
      if (roleFrom(session) !== APP_ROLE) {
        signOut()
        toast.error('This portal is for platform administrators only.')
        return
      }
      navigate(APP_HOME)
    } catch (error) {
      toast.error(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="relative flex min-h-svh flex-col bg-background">
      <ThemeToggle className="absolute top-4 right-4 z-20 sm:top-5 sm:right-5" />

      <div className="grid flex-1 lg:grid-cols-[1.15fr_0.85fr]">
        <BrandPanel className="hidden lg:flex" />

        <section className="flex flex-col">
          <div className="border-b border-border/70 px-5 py-4 lg:hidden">
            <BrandMark />
          </div>

          <div className="flex flex-1 flex-col justify-center px-5 py-8 sm:px-8">
            <div className="mx-auto w-full max-w-[640px] space-y-8 lg:max-w-none lg:space-y-0">
              <div className="lg:hidden">
                <h1 className="text-[1.65rem] leading-tight font-semibold tracking-tight text-foreground sm:text-3xl">
                  Building Pakistan’s AI-powered{' '}
                  <span className="text-brand-gradient">education ecosystem</span>
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sign in to manage institutions, access, and platform configuration.
                </p>
              </div>

              <div className="flex justify-center lg:min-h-full lg:items-center">
                <LoginCard
                  email={email}
                  password={password}
                  remember={remember}
                  busy={busy}
                  onEmailChange={setEmail}
                  onPasswordChange={setPassword}
                  onRememberChange={setRemember}
                  onSubmit={() => void submit()}
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
