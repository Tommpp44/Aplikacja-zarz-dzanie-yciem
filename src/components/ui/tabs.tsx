'use client'

import { Tabs as TabsPrimitive } from 'radix-ui'
import * as React from 'react'
import { cn } from '@/lib/utils'

const Tabs = TabsPrimitive.Root

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn(
        'bg-muted text-muted-foreground inline-flex h-9 items-center gap-0.5 rounded-lg p-[3px]',
        className,
      )}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'hover:text-foreground focus-visible:ring-ring/40 data-[state=active]:bg-card data-[state=active]:text-foreground inline-flex h-full items-center justify-center gap-1.5 rounded-md px-3 text-[13px] font-medium whitespace-nowrap transition-colors outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-xs [&_svg]:size-4',
        className,
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return <TabsPrimitive.Content className={cn('outline-none', className)} {...props} />
}

export { Tabs, TabsContent, TabsList, TabsTrigger }
