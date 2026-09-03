import { cn } from '@/lib/utils'

export function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src="/logo.png"
      alt="Taleem AI"
      className={cn('h-10 w-auto object-contain object-left', className)}
    />
  )
}
