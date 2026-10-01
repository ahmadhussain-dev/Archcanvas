// Talks to the 2D/3D editor running in the iframe at /editor/?embed=1
// (engine/example/js/Embed.js). Same origin only.
const SOURCE = 'archcanvas'

export function createEditorBridge(iframe, handlers) {
  const pending = new Map()
  let nextId = 1

  function onMessage(event) {
    if (event.origin !== window.location.origin || event.source !== iframe.contentWindow) return
    const msg = event.data
    if (!msg || msg.source !== SOURCE) return
    if (msg.type === 'snapshot' || (msg.type === 'error' && msg.requestId)) {
      const p = pending.get(msg.requestId)
      if (!p) return
      pending.delete(msg.requestId)
      if (msg.type === 'snapshot') p.resolve(msg.building)
      else p.reject(new Error(msg.message))
      return
    }
    handlers[msg.type]?.(msg)
  }
  window.addEventListener('message', onMessage)

  const post = (type, data = {}) => iframe.contentWindow?.postMessage({ source: SOURCE, type, ...data }, window.location.origin)

  return {
    load(data) {
      post('load', data)
    },
    // Resolves with the current building file (a JSON string).
    snapshot(name, timeoutMs = 15000) {
      const requestId = nextId++
      return new Promise((resolve, reject) => {
        pending.set(requestId, { resolve, reject })
        post('snapshot', { requestId, name })
        setTimeout(() => {
          if (pending.delete(requestId)) reject(new Error('The editor did not answer. Try saving again.'))
        }, timeoutMs)
      })
    },
    dispose() {
      window.removeEventListener('message', onMessage)
      pending.forEach((p) => p.reject(new Error('Editor closed')))
      pending.clear()
    }
  }
}
