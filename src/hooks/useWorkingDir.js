import { useEffect, useState } from 'react'
import useAppStore from '../store/useAppStore'

export default function useWorkingDir() {
  const [loaded, setLoaded] = useState(false)
  const setWorkingDir = useAppStore(s => s.setWorkingDir)

  useEffect(() => {
    let mounted = true
    window.electronAPI.settingsGet('workingDir').then((wd) => {
      if (mounted) {
        setWorkingDir(wd)
        setLoaded(true)
      }
    })
    return () => { mounted = false }
  }, [])

  return { loaded }
}
