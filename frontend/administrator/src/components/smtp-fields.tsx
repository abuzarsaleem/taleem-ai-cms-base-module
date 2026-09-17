import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field, FieldGrid } from '@/components/field'
import { PasswordInput } from '@/components/password-input'
import { smtpHostError, smtpPasswordSecretRefError, type SmtpDraft } from '@/lib/smtp'
import { SmtpEncryption } from '@/lib/types'

export function SmtpFields({
  value,
  onChange,
}: {
  value: SmtpDraft
  onChange: (next: SmtpDraft) => void
}) {
  const patch = (partial: Partial<SmtpDraft>) => onChange({ ...value, ...partial })
  const hostError = smtpHostError(value)
  const secretRefError = smtpPasswordSecretRefError(value)

  return (
    <FieldGrid>
      <Field label="Host" required error={hostError ?? undefined}>
        <Input
          value={value.host}
          maxLength={255}
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(hostError)}
          onChange={(e) => patch({ host: e.target.value })}
        />
      </Field>
      <Field label="Port">
        <Input type="number" min={1} max={65535} value={value.port} onChange={(e) => patch({ port: e.target.value })} />
      </Field>
      <Field label="Username">
        <Input value={value.username} maxLength={255} onChange={(e) => patch({ username: e.target.value })} />
      </Field>
      <Field
        label="Secret reference"
        hint="Protected secret location reference, e.g. secret://path/to/secret or vault://key-name."
        error={secretRefError ?? undefined}
      >
        <PasswordInput
          autoComplete="off"
          maxLength={500}
          value={value.passwordSecretRef}
          aria-invalid={Boolean(secretRefError)}
          onChange={(e) => patch({ passwordSecretRef: e.target.value })}
        />
      </Field>
      <Field label="Encryption">
        <Select value={value.encryption} onValueChange={(encryption) => patch({ encryption: encryption as SmtpEncryption })}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(SmtpEncryption).map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field label="From name">
        <Input value={value.fromName} maxLength={255} onChange={(e) => patch({ fromName: e.target.value })} />
      </Field>
      <Field label="From email">
        <Input type="email" value={value.fromEmail} onChange={(e) => patch({ fromEmail: e.target.value })} />
      </Field>
      <Field label="Reply-to email">
        <Input type="email" value={value.replyToEmail} onChange={(e) => patch({ replyToEmail: e.target.value })} />
      </Field>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <Checkbox checked={value.isActive} onCheckedChange={(checked) => patch({ isActive: checked === true })} />
        Active
      </label>
    </FieldGrid>
  )
}
