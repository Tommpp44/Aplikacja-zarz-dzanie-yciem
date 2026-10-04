import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { currentLocale } from '@/lib/i18n/locale-state'
import { translate } from '@/lib/i18n/translate'
import { cn } from '@/lib/utils'

export function Widget({
  title,
  href,
  linkLabel,
  children,
  className,
}: {
  title: string
  href?: string
  linkLabel?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {href && (
          <Link href={href} className="text-primary text-xs hover:underline">
            {linkLabel ?? translate(currentLocale(), 'Open')}
          </Link>
        )}
      </CardHeader>
      <CardContent className="flex-1">{children}</CardContent>
    </Card>
  )
}
