import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  BookOpen,
  Building2,
  Compass,
  GraduationCap,
  Mail,
  Users,
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
    tone: 'text-[#0d9488] dark:text-[#5eead4]',
    surface: 'bg-[#ccfbf1] dark:bg-[#0f766e]/25',
  },
  {
    title: 'Teachers',
    description: 'Teach better with intelligent tools.',
    icon: Users,
    tone: 'text-[#7c3aed] dark:text-[#c4b5fd]',
    surface: 'bg-[#ede9fe] dark:bg-[#6d28d9]/25',
  },
  {
    title: 'Institutions',
    description: 'Manage with AI-driven solutions.',
    icon: Building2,
    tone: 'text-[#0d9488] dark:text-[#5eead4]',
    surface: 'bg-[#ccfbf1] dark:bg-[#0f766e]/25',
  },
  {
    title: 'Assessments',
    description: 'AI-powered tests and insights.',
    icon: BarChart3,
    tone: 'text-[#7c3aed] dark:text-[#c4b5fd]',
    surface: 'bg-[#f3e8ff] dark:bg-[#6d28d9]/25',
  },
  {
    title: 'Career Guidance',
    description: 'Discover the right career path.',
    icon: Compass,
    tone: 'text-[#0d9488] dark:text-[#5eead4]',
    surface: 'bg-[#ccfbf1] dark:bg-[#0f766e]/25',
  },
  {
    title: 'Digital Content',
    description: 'High-quality learning content powered by AI.',
    icon: BookOpen,
    tone: 'text-[#7c3aed] dark:text-[#c4b5fd]',
    surface: 'bg-[#ede9fe] dark:bg-[#6d28d9]/25',
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

/** Four-pointed Taleem mark matching the sign-in mock. */
function TaleemMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden>
      <path
        d="M20 3.5c.55 0 1.05.3 1.32.79l4.2 7.55c.14.25.36.43.62.52l8.2 2.7c1.1.36 1.5 1.72.74 2.58l-5.9 6.7a1.4 1.4 0 0 0-.34.8l.7 8.55c.1 1.15-1 2.04-2.08 1.6l-7.9-3.22a1.4 1.4 0 0 0-1.06 0l-7.9 3.22c-1.08.44-2.18-.45-2.08-1.6l.7-8.55c.04-.3-.07-.59-.34-.8l-5.9-6.7c-.76-.86-.36-2.22.74-2.58l8.2-2.7c.26-.09.48-.27.62-.52l4.2-7.55A1.5 1.5 0 0 1 20 3.5Z"
        className="fill-[#0d9488] dark:fill-[#5eead4]"
      />
      <circle cx="20" cy="18.5" r="3.2" className="fill-white dark:fill-[#070f24]" />
      <path
        d="M13.8 27.2c1.7-2.2 4-3.3 6.2-3.3s4.5 1.1 6.2 3.3"
        className="stroke-white dark:stroke-[#070f24]"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('flex items-center gap-3', compact && 'gap-2.5')}>
      <TaleemMark className={cn('shrink-0', compact ? 'size-9' : 'size-11')} />
      <div className="min-w-0">
        <p className={cn('font-semibold tracking-tight text-foreground', compact ? 'text-base' : 'text-lg')}>
          Taleem <span className="text-primary">AI</span>
        </p>
        <p className="text-[10px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          AI for the future of education
        </p>
      </div>
    </div>
  )
}

function BrandPanel({ className }: { className?: string }) {
  return (
    <section className={cn('login-brand-panel relative overflow-hidden', className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.5] dark:opacity-[0.25]"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgb(100 116 139 / 0.16) 1px, transparent 0)',
          backgroundSize: '22px 22px',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-[12%] -right-20 size-96 rounded-full bg-[radial-gradient(circle,rgb(124_58_237_/_0.1),transparent_70%)] blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 -left-16 size-[22rem] rounded-full bg-[radial-gradient(circle,rgb(37_99_235_/_0.14),transparent_68%)]"
      />

      <div className="relative flex h-full flex-col justify-between gap-10 p-8 sm:p-10 lg:p-12 xl:p-14">
        <BrandMark />

        <div className="max-w-[36rem]">
          <h1 className="text-[2.05rem] leading-[1.2] font-semibold tracking-tight text-foreground sm:text-[2.45rem] lg:text-[2.65rem]">
            Building Pakistan’s AI-powered{' '}
            <span className="text-[#2563eb] dark:text-[#60a5fa]">education</span>{' '}
            <span className="text-ecosystem-gradient">ecosystem</span> for students, teachers and
            institutions.
          </h1>

          <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
              <div key={feature.title} className="flex min-w-0 flex-col items-center text-center">
                <span
                  className={cn(
                    'mb-3 inline-flex size-11 items-center justify-center rounded-[0.85rem]',
                    feature.surface,
                    feature.tone,
                  )}
                >
                  <feature.icon className="size-[1.15rem] stroke-[1.7]" />
                </span>
                <p className="text-[0.95rem] font-semibold text-foreground">{feature.title}</p>
                <p className="mt-1 text-[0.8rem] leading-relaxed text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 max-w-md text-sm text-muted-foreground">
          Transforming education through the power of{' '}
          <span className="font-semibold text-[#2563eb] dark:text-[#60a5fa]">Artificial Intelligence.</span>
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
      <div className="rounded-2xl border border-border bg-card p-6 shadow-[0_18px_50px_rgb(15_23_42_/_0.08)] dark:shadow-[0_18px_50px_rgb(0_0_0_/_0.35)] sm:p-8">
        <div>
          <h2 className="text-[1.65rem] font-semibold tracking-tight text-foreground">Welcome back</h2>
          <p className="mt-1.5 text-sm text-muted-foreground">Sign in to your TaleemAI CMS account.</p>
        </div>

        <div className="mt-6 space-y-4">
          <Field label="Email">
            <div className="relative">
              <Input
                type="email"
                autoComplete="username"
                placeholder="name@yourorganization.com"
                value={email}
                className="h-11 bg-background pr-10"
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
              className="h-11 bg-background"
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
            className="login-continue h-11 w-full rounded-xl text-sm font-semibold"
            loading={busy}
            disabled={!email || !password}
            onClick={onSubmit}
          >
            Continue →
          </Button>
        </div>

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full gap-2 rounded-xl"
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
          className="font-semibold text-primary hover:underline"
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
      <div className="grid flex-1 lg:grid-cols-[1.08fr_0.92fr]">
        <BrandPanel className="hidden lg:flex" />

        <section className="relative flex flex-col bg-background">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-35 dark:opacity-20"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgb(148 163 184 / 0.22) 1px, transparent 0)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative flex items-center justify-between gap-3 border-b border-border px-5 py-4 lg:hidden">
            <BrandMark compact />
            <ThemeToggle />
          </div>

          <div className="relative hidden items-center justify-end gap-3 px-8 pt-6 lg:flex xl:px-10">
            <p className="text-xs font-medium tracking-[0.08em] text-muted-foreground">
              Simple · Smart · Scalable
            </p>
            <ThemeToggle />
          </div>

          <div className="relative flex flex-1 flex-col justify-center px-5 py-8 sm:px-8 xl:px-10">
            <div className="mx-auto w-full max-w-[640px] space-y-8 lg:max-w-none lg:space-y-0">
              <div className="lg:hidden">
                <h1 className="text-[1.65rem] leading-tight font-semibold tracking-tight text-foreground sm:text-3xl">
                  Building Pakistan’s AI-powered{' '}
                  <span className="text-[#2563eb] dark:text-[#60a5fa]">education</span>{' '}
                  <span className="text-ecosystem-gradient">ecosystem</span>
                </h1>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sign in to manage institutions, access, and platform configuration.
                </p>
              </div>

              <div className="flex justify-center lg:min-h-[28rem] lg:items-center">
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

          <footer className="relative mt-auto flex flex-col gap-2 px-5 py-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8 xl:px-10">
            <p>© 2026 Taleem AI. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <button type="button" className="hover:text-foreground" onClick={() => toast.message('Privacy policy coming soon.')}>
                Privacy
              </button>
              <button type="button" className="hover:text-foreground" onClick={() => toast.message('Terms of use coming soon.')}>
                Terms
              </button>
              <button type="button" className="hover:text-foreground" onClick={() => toast.message('Contact support via your platform administrator.')}>
                Support
              </button>
            </div>
          </footer>
        </section>
      </div>
    </div>
  )
}
