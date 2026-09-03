import { useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Field, FieldGrid } from '@/components/field'
import { PageHeader } from '@/components/page-header'
import { useStore } from '@/lib/store'
import { SmtpEncryption } from '@/lib/types'

export function TenantConfigurationPage() {
  const { store, setStore } = useStore()
  const tenantId = store.tenants[0]?.id ?? ''
  const config = store.configurations.find((row) => row.tenantId === tenantId)
  const smtp = store.smtp.find((row) => row.tenantId === tenantId)
  const branding = store.branding.find((row) => row.tenantId === tenantId)
  const [timezone, setTimezone] = useState(config?.timezone ?? 'Asia/Karachi')
  const [locale, setLocale] = useState(config?.locale ?? 'en-PK')
  const [dateFormat, setDateFormat] = useState(config?.dateFormat ?? 'DD/MM/YYYY')
  const [currencyCode, setCurrencyCode] = useState(config?.currencyCode ?? 'PKR')
  const [host, setHost] = useState(smtp?.host ?? '')
  const [fromEmail, setFromEmail] = useState(smtp?.fromEmail ?? '')
  const [smtpActive, setSmtpActive] = useState(smtp?.isActive ?? false)
  const [primaryColor, setPrimaryColor] = useState(branding?.primaryColor ?? '#081B45')
  const [accentColor, setAccentColor] = useState(branding?.accentColor ?? '#36BABC')
  const [supportEmail, setSupportEmail] = useState(branding?.supportEmail ?? '')

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PageHeader
        eyebrow="BWF-006"
        title="Common configuration"
        description="Only cross-application settings belong here. Domain application settings stay in those applications."
      />
      <Card className="portal-card">
        <CardHeader>
          <CardTitle>Regional defaults</CardTitle>
          <CardDescription>Timezone, locale, date format, and currency.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGrid>
            <Field label="Timezone">
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            </Field>
            <Field label="Locale">
              <Input value={locale} onChange={(e) => setLocale(e.target.value)} />
            </Field>
            <Field label="Date format">
              <Input value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} />
            </Field>
            <Field label="Currency">
              <Input value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} />
            </Field>
          </FieldGrid>
          <Button
            onClick={() => {
              setStore((prev) => ({
                ...prev,
                configurations: prev.configurations.some((row) => row.tenantId === tenantId)
                  ? prev.configurations.map((row) =>
                      row.tenantId === tenantId
                        ? { ...row, timezone, locale, dateFormat, currencyCode }
                        : row,
                    )
                  : [...prev.configurations, { tenantId, timezone, locale, dateFormat, currencyCode }],
              }))
              toast.success('Configuration saved')
            }}
          >
            Save defaults
          </Button>
        </CardContent>
      </Card>

      <Card className="portal-card">
        <CardHeader>
          <CardTitle>SMTP</CardTitle>
          <CardDescription>Used for invitations and common notifications. Passwords are never stored in the UI.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGrid>
            <Field label="Host">
              <Input value={host} onChange={(e) => setHost(e.target.value)} />
            </Field>
            <Field label="From email">
              <Input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} />
            </Field>
          </FieldGrid>
          <label className="flex items-center gap-2 text-sm">
            <Switch checked={smtpActive} onCheckedChange={setSmtpActive} />
            SMTP enabled
          </label>
          <Button
            onClick={() => {
              setStore((prev) => ({
                ...prev,
                smtp: prev.smtp.some((row) => row.tenantId === tenantId)
                  ? prev.smtp.map((row) =>
                      row.tenantId === tenantId
                        ? { ...row, host, fromEmail, isActive: smtpActive }
                        : row,
                    )
                  : [
                      ...prev.smtp,
                      {
                        tenantId,
                        host,
                        port: 587,
                        encryption: SmtpEncryption.TLS,
                        fromEmail,
                        isActive: smtpActive,
                      },
                    ],
              }))
              toast.success('SMTP saved')
            }}
          >
            Save SMTP
          </Button>
        </CardContent>
      </Card>

      <Card className="portal-card">
        <CardHeader>
          <CardTitle>Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FieldGrid>
            <Field label="Primary colour">
              <Input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            </Field>
            <Field label="Accent colour">
              <Input value={accentColor} onChange={(e) => setAccentColor(e.target.value)} />
            </Field>
            <Field label="Support email">
              <Input value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
            </Field>
          </FieldGrid>
          <div className="flex gap-3">
            <span className="size-10 rounded-lg border" style={{ background: primaryColor }} />
            <span className="size-10 rounded-lg border" style={{ background: accentColor }} />
          </div>
          <Button
            onClick={() => {
              setStore((prev) => ({
                ...prev,
                branding: prev.branding.some((row) => row.tenantId === tenantId)
                  ? prev.branding.map((row) =>
                      row.tenantId === tenantId
                        ? { ...row, primaryColor, accentColor, supportEmail }
                        : row,
                    )
                  : [
                      ...prev.branding,
                      {
                        tenantId,
                        primaryColor,
                        secondaryColor: '#FFFFFF',
                        accentColor,
                        supportEmail,
                      },
                    ],
              }))
              toast.success('Branding saved')
            }}
          >
            Save branding
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
