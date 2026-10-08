import { useCallback, useEffect, useState } from 'react'
import { api } from './api.js'

// Loads data from the API: { data, error, loading, reload, setData }.
export function useApi(path) {
  const [state, setState] = useState({ data: null, error: null, loading: true })

  const load = useCallback(() => {
    if (!path) return undefined
    let alive = true
    setState((s) => ({ ...s, loading: true, error: null }))
    api
      .get(path)
      .then((data) => alive && setState({ data, error: null, loading: false }))
      .catch((error) => alive && setState({ data: null, error, loading: false }))
    return () => {
      alive = false
    }
  }, [path])

  useEffect(() => load(), [load])

  const setData = useCallback((update) => setState((s) => ({ ...s, data: typeof update === 'function' ? update(s.data) : update })), [])
  return { ...state, reload: load, setData }
}
