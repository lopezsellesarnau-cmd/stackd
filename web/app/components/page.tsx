import type { Metadata } from 'next'
import { Shop } from '@/components/shop'

export const metadata: Metadata = {
  title: 'Components | StackD',
  description: 'Interface components with the Figma file and the React code. Try them right here.',
  alternates: { canonical: '/components' },
}

export default function ComponentsPage() {
  return <Shop />
}
