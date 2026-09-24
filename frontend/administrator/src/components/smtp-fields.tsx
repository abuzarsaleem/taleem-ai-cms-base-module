import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { Field, FieldGrid } from '@/components/field'
import { PasswordInput } from '@/components/password-input'
import type { SmtpDraft } from '@/lib/smtp'
import { SmtpEncryption } from '@/lib/types'

export function SmtpFields({
  value,
  onChange,
  errors = {},
}: {
  value: SmtpDraft
  onChange: (next: SmtpDraft) => void
  errors?: Partial<Record<keyof SmtpDraft, string>>
}) {
  const patch = (partial: Partial<SmtpDraft>) => onChange({ ...value, ...partial })

  return (
    <FieldGrid>
      <Field label="Host" required error={errors.host}>
        <Input
          value={value.host}
          maxLength={255}
          autoComplete="off"
          spellCheck={false}
          onChange={(e) => patch({ host: e.target.value })}
        />
      </Field>
      <Field label="Port" error={errors.port}>
        <Input type="number" min={1} max={65535} value={value.port} onChange={(e) => patch({ port: e.target.value })} />
      </Field>
      <Field label="Username" error={errors.username}>
        <Input value={value.username} maxLength={255} onChange={(e) => patch({ username: e.target.value })} />
      </Field>
      <Field
        label="Secret reference"
        hint="Protected secret location reference, e.g. secret://path/to/secret or vault://key-name."
        error={errors.passwordSecretRef}
      >
        <PasswordInput
          autoComplete="off"
          maxLength={500}
          value={value.passwordSecretRef}
          onChange={(e) => patch({ passwordSecretRef: e.target.value })}
        />
      </Field>
      <Field label="Encryption" error={errors.encryption}>
        <SearchableSelect
          value={value.encryption}
          onValueChange={(encryption) => patch({ encryption: encryption as SmtpEncryption })}
          options={Object.values(SmtpEncryption).map((item) => ({
            value: item,
            label: item,
          }))}
          placeholder="Select encryption"
        />
      </Field>
      <Field label="From name" error={errors.fromName}>
        <Input value={value.fromName} maxLength={255} onChange={(e) => patch({ fromName: e.target.value })} />
      </Field>
      <Field label="From email" error={errors.fromEmail}>
        <Input type="email" value={value.fromEmail} onChange={(e) => patch({ fromEmail: e.target.value })} />
      </Field>
      <Field label="Reply-to email" error={errors.replyToEmail}>
        <Input type="email" value={value.replyToEmail} onChange={(e) => patch({ replyToEmail: e.target.value })} />
      </Field>
      <label className="flex items-center gap-2 text-sm sm:col-span-2">
        <Checkbox checked={value.isActive} onCheckedChange={(checked) => patch({ isActive: checked === true })} />
        Active — when disabled, no emails will be sent from this SMTP configuration.
      </label>
    </FieldGrid>
  )
}
