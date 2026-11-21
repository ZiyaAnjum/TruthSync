import { useId, type ReactNode } from 'react'
import { isDemoMode } from '../lib/dataSource'
import { BrandMark } from './BrandMark'
import { Stepper } from './Stepper'

type PageLayoutProps = {
  children: ReactNode
  side?: ReactNode
  step?: 1 | 2 | 3
}

export function PageLayout({ children, side, step = 1 }: PageLayoutProps) {
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
        <div className="site-header__content mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="brand-lockup">
            <BrandMark />
            <div className="brand-lockup__copy">
              <p className="brand-lockup__name">TruthSync</p>
              <p className="brand-lockup__tagline hidden min-[640px]:block">
                Verify what AI says. Stay in sync with reality.
              </p>
            </div>
          </div>
          <p className="mode-pill">
            <span className="mode-pill__dot" aria-hidden="true" />
            {isDemoMode ? 'Demo mode' : 'Live'}
          </p>
        </div>
      </header>

      <Stepper step={step} />

      <main
        id={mainContentId}
        tabIndex={-1}
        className="site-main screen-enter mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
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
          <p>TruthSync | SheBuilds | Global AI Hackathon 2026</p>
        </div>
      </footer>
    </div>
  )
}
