export type ActionQueueItem = {
  id: string
  title: string
  description?: string
  due?: string | null
  href: string
  meta?: string
}

export type ActionQueueGroup = {
  key: string
  label: string
  items: ActionQueueItem[]
}
