import { ReactNode } from 'react'

type PageTransitionProps = {
  children: ReactNode
  introActive: boolean
  introProgress: number
  introMessage: string
}

function PageTransition({ children, introActive, introProgress, introMessage }: PageTransitionProps) {
  const clampedProgress = Math.max(0, Math.min(100, Math.round(introProgress)))

  return (
    <div className={`page-transition${introActive ? ' page-transition--intro' : ''}`}>
      {introActive ? (
        <div className="page-transition__loader" role="status" aria-live="polite" aria-label="Loading app">
          <div className="page-transition__loader-panel">
            <div className="page-transition__loader-head">
              <div className="page-transition__loader-avatar" aria-hidden="true">
                <span>MS</span>
              </div>
              <p className="page-transition__loader-brand">MiniSocial</p>
            </div>
            <h2 className="page-transition__loader-title">Syncing your social world</h2>
            <p className="page-transition__loader-subtitle">Securing session and loading personalized feed data.</p>

            <div className="page-transition__loader-track" aria-hidden="true">
              <div className="page-transition__loader-progress" style={{ width: `${clampedProgress}%` }} />
            </div>
            <p className="page-transition__loader-percentage" aria-hidden="true">{clampedProgress}%</p>

            <div className="page-transition__loader-steps" aria-hidden="true">
              <span className={`page-transition__loader-step${clampedProgress >= 30 ? ' page-transition__loader-step--active' : ''}`}>
                Connecting to graph
              </span>
              <span className={`page-transition__loader-step${clampedProgress >= 70 ? ' page-transition__loader-step--active' : ''}`}>
                Loading recommendations
              </span>
              <span className={`page-transition__loader-step${clampedProgress >= 95 ? ' page-transition__loader-step--active' : ''}`}>
                Preparing interface
              </span>
            </div>

            <div className="page-transition__loader-footer">
              <span className="page-transition__loader-dot" aria-hidden="true" />
              <p className="page-transition__loader-text">{introMessage}</p>
            </div>
          </div>
        </div>
      ) : null}

      {introActive ? <div aria-hidden="true" className="page-transition__veil" /> : null}
      <div className={`page-transition__content${introActive ? ' page-transition__content--intro' : ''}`}>{children}</div>
    </div>
  )
}

export { PageTransition }