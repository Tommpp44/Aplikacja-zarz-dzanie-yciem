'use client'

import { BellRing } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Switch } from '@/components/ui/switch'
import { useT } from '@/lib/i18n/client'
import { deletePushSubscription, savePushSubscription } from '@/lib/push/actions'

type State = 'unsupported' | 'denied' | 'off' | 'on' | 'loading'

function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const raw = atob((base64 + padding).replace(/-/g, '+').replace(/_/g, '/'))
  return Uint8Array.from(raw, (c) => c.charCodeAt(0))
}

/** Per-device opt-in for Web Push (reminders when LifeOS is closed). */
export function PushToggle({ publicKey }: { publicKey: string }) {
  const t = useT()
  const [state, setState] = useState<State>('loading')

  useEffect(() => {
    let cancelled = false
    const check = async () => {
      if (!publicKey || !('serviceWorker' in navigator) || !('PushManager' in window))
        return 'unsupported'
      if (Notification.permission === 'denied') return 'denied'
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = await reg?.pushManager.getSubscription()
      return sub ? 'on' : 'off'
    }
    void check().then((s: State) => !cancelled && setState(s))
    return () => {
      cancelled = true
    }
  }, [publicKey])

  const enable = async () => {
    setState('loading')
    try {
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') return setState(permission === 'denied' ? 'denied' : 'off')
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } }
      const r = await savePushSubscription({
        endpoint: json.endpoint,
        keys: json.keys,
        user_agent: navigator.userAgent.slice(0, 300),
      })
      if (!r.ok) throw new Error(r.error)
      setState('on')
      toast.success(t('Push notifications enabled on this device'))
    } catch {
      setState('off')
      toast.error(t('Could not enable push notifications on this device.'))
    }
  }

  const disable = async () => {
    setState('loading')
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = await reg?.pushManager.getSubscription()
    if (sub) {
      await deletePushSubscription({ endpoint: sub.endpoint })
      await sub.unsubscribe()
    }
    setState('off')
  }

  const hint =
    state === 'unsupported'
      ? t('Not available in this browser or not configured on the server.')
      : state === 'denied'
        ? t('Notifications are blocked for LifeOS in your browser settings.')
        : t('Get reminders on this device even when LifeOS is closed.')

  return (
    <label className="bg-card flex items-center justify-between gap-4 rounded-lg border px-4 py-3">
      <span className="flex items-start gap-3">
        <BellRing className="text-primary mt-0.5 size-4 shrink-0" aria-hidden />
        <span>
          <span className="block text-sm font-medium">
            {t('Push notifications on this device')}
          </span>
          <span className="text-muted-foreground block text-xs">{hint}</span>
        </span>
      </span>
      <Switch
        checked={state === 'on'}
        disabled={state === 'unsupported' || state === 'denied' || state === 'loading'}
        onCheckedChange={(v) => void (v ? enable() : disable())}
      />
    </label>
  )
}
