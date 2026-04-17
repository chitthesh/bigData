import { ReactNode } from 'react'

import { InstagramNavbar } from './InstagramNavbar'

type LayoutProps = {
  children: ReactNode
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#e0ecff_0%,#f8fafc_38%,#f6f7fb_100%)]">
      <InstagramNavbar />

      <div className="mx-auto flex w-full max-w-7xl gap-6 px-4 pb-24 pt-28 md:px-6 md:pt-24">
        <div className="min-w-0 flex-1 rounded-3xl border border-white/80 bg-white/80 p-3 shadow-[0_10px_40px_rgba(15,23,42,0.08)] backdrop-blur md:p-5">
          {children}
        </div>
      </div>
    </div>
  )
}

export { Layout }
