import { useId, type ReactNode } from 'react'

type PageLayoutProps = {
  children: ReactNode
  side?: ReactNode
}

export function PageLayout({ children, side }: PageLayoutProps) {
  const mainContentId = `main-content-${useId().replace(/:/g, '')}`

  return (
    <div className="site-shell min-h-screen min-w-0 overflow-x-hidden">
      <a
        href={`#${mainContentId}`}
        className="sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:not-sr-only focus:rounded-lg focus:bg-white focus:px-4 focus:py-3 focus:font-semibold focus:text-blue-900 focus:shadow-lg focus-visible:ring-2 focus-visible:ring-blue-700 focus-visible:ring-offset-2"
      >
        Skip to main content
      </a>
      <header className="site-header">
        <div className="site-header__content mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-7 lg:px-8">
          <p className="text-xl font-bold tracking-tight text-white sm:text-2xl">TruthSync</p>
          <p className="mt-1 text-sm text-white">
            Verify what AI says. Stay in sync with reality.
          </p>
        </div>
      </header>

      <main
        id={mainContentId}
        tabIndex={-1}
        className="site-main mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8"
      >
        {side ? (
          <div className="grid min-w-0 grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
            <div className="min-w-0">{children}</div>
            <aside className="min-w-0">{side}</aside>
          </div>
        ) : (
          <div className="min-w-0">{children}</div>
        )}
      </main>
      <footer className="site-footer border-t">
        <div className="site-footer__content mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold tracking-wide text-slate-600">TruthSync</p>
        </div>
      </footer>
    </div>
  )
}
