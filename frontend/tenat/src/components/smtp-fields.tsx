import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Field, FieldGrid } from '@/components/field'
import type { SmtpDraft } from '@/lib/smtp'
import { SmtpEncryption } from '@/lib/types'

export function SmtpFields({
  value,
  onChange,
}: {
  value: SmtpDraft
  onChange: (next: SmtpDraft) => void
}) {
  const patch = (partial: Partial<SmtpDraft>) => onChange({ ...value, ...partial })

  return (
    <FieldGrid>
      <Field label="Host" required>
        <Input value={value.host} maxLength={255} onChange={(e) => patch({ host: e.target.value })} />
      </Field>
      <Field label="Port">
        <Input type="number" min={1} max={65535} value={value.port} onChange={(e) => patch({ port: e.target.value })} />
      </Field>
      <Field label="Username">
        <Input value={value.username} maxLength={255} onChange={(e) => patch({ username: e.target.value })} />
      </Field>
      <Field label="Password secret ref" hint="Secret manager reference, never plaintext.">
        <Input value={value.passwordSecretRef} maxLength={500} onChange={(e) => patch({ passwordSecretRef: e.target.value })} />
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
