import { Input } from '@/components/ui/input'
import { parseHexColor } from '@/lib/utils'

export function ColorInput({
  value,
  onChange,
  placeholder = '#1A73E8',
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const parsed = parseHexColor(value)
  const pickerValue = (parsed ?? parseHexColor(placeholder) ?? '#000000').toLowerCase()

  return (
    <div className="flex items-center gap-2">
      <label className="relative size-8 shrink-0 cursor-pointer overflow-hidden rounded-lg border border-input">
        <span
          className="absolute inset-0"
          style={{ backgroundColor: parsed ?? 'transparent' }}
        />
        {!parsed ? (
          <span className="absolute inset-0 bg-[repeating-conic-gradient(var(--muted)_0%_25%,transparent_0%_50%)] bg-[length:10px_10px]" />
        ) : null}
        <input
          type="color"
          value={pickerValue}
          aria-label="Pick a color"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={(event) => onChange(event.target.value.toUpperCase())}
        />
      </label>
      <Input
        value={value}
        placeholder={placeholder}
        maxLength={7}
        spellCheck={false}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => {
          if (parsed) onChange(parsed)
        }}
      />
    </div>
  )
}
