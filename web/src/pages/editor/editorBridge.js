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
    if (msg.type === 'snapshot' || msg.type === 'aiPreviewed' || (msg.type === 'error' && msg.requestId)) {
      const p = pending.get(msg.requestId)
      if (!p) return
      pending.delete(msg.requestId)
      if (msg.type === 'snapshot') p.resolve(msg.building)
      else if (msg.type === 'aiPreviewed') p.resolve({ applied: msg.applied, skipped: msg.skipped })
      else p.reject(new Error(msg.message))
      return
    }
    handlers[msg.type]?.(msg)
  }
  window.addEventListener('message', onMessage)

  const post = (type, data = {}) => iframe.contentWindow?.postMessage({ source: SOURCE, type, ...data }, window.location.origin)

  function request(type, data, timeoutMs, timeoutMessage) {
    const requestId = nextId++
    return new Promise((resolve, reject) => {
      pending.set(requestId, { resolve, reject })
      post(type, { requestId, ...data })
      setTimeout(() => {
        if (pending.delete(requestId)) reject(new Error(timeoutMessage))
      }, timeoutMs)
    })
  }

  return {
    load(data) {
      post('load', data)
    },
    // '2d', '3d' or 'split'
    setView(view) {
      post('view', { view })
    },
    // Resolves with the current building file (a JSON string).
    snapshot(name, timeoutMs = 15000) {
      return request('snapshot', { name }, timeoutMs, 'The editor did not answer. Try saving again.')
    },
    // Ask ArchCanvas: show AI changes in the editor as one undoable step.
    // Resolves with { applied, skipped } (each { label, reason? }).
    aiPreview(operations, timeoutMs = 30000) {
      return request('aiPreview', { operations }, timeoutMs, 'The editor did not answer. Try again.')
    },
    // 'before' or 'after', while a preview is open
    aiShow(which) {
      post('aiShow', { which })
    },
    aiAccept() {
      post('aiAccept')
    },
    aiReject() {
      post('aiReject')
    },
    dispose() {
      window.removeEventListener('message', onMessage)
      pending.forEach((p) => p.reject(new Error('Editor closed')))
      pending.clear()
    }
  }
}
