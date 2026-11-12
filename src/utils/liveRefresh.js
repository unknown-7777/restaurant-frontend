const DEFAULT_REFRESH_INTERVAL = 5000

/** Keep a screen current while it is open, and refresh promptly on tab return. */
export function startLiveRefresh(refresh, interval = DEFAULT_REFRESH_INTERVAL) {
  let running = false

  const run = async () => {
    if (running || document.visibilityState === 'hidden') return
    running = true
    try {
      await refresh()
    } catch {
      // A transient API failure should not stop future refresh attempts.
    } finally {
      running = false
    }
  }

  const onVisibilityChange = () => {
    if (document.visibilityState === 'visible') run()
  }

  const timer = window.setInterval(run, interval)
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('focus', run)

  return () => {
    window.clearInterval(timer)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('focus', run)
  }
}
