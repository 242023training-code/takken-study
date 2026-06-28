import BottomNav from '@/components/BottomNav'

export default function MainLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="page-container">
      <main className="pb-20">{children}</main>
      <BottomNav />
    </div>
  )
}
