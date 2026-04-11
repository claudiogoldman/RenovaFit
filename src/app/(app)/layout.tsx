import { AppNav } from '@/components/layout/AppNav'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppNav />
      {children}
    </>
  )
}
