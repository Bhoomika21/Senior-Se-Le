import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Don't show if already installed or dismissed
    if (localStorage.getItem('ssl_install_dismissed')) return
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  async function handleInstall() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      localStorage.setItem('ssl_install_dismissed', 'true')
    }
    setShow(false)
    setDeferredPrompt(null)
  }

  function handleDismiss() {
    localStorage.setItem('ssl_install_dismissed', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 bg-navy rounded-card shadow-2xl p-4 flex items-center gap-3 border border-white/10">
      <div className="w-10 h-10 rounded-xl bg-orange flex items-center justify-center shrink-0 font-devanagari font-bold text-white text-lg">
        से
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-white text-sm">Install Senior Se Le</p>
        <p className="text-white/50 text-[10px] mt-0.5">Add to home screen for the best experience</p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={handleInstall}
          className="bg-orange text-white text-xs font-display font-bold px-3 py-1.5 rounded-chip active:scale-95 transition-transform"
        >
          Install
        </button>
        <button onClick={handleDismiss} className="text-white/40">
          <X size={16} />
        </button>
      </div>
    </div>
  )
}
