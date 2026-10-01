import { Component } from 'react'
import RouteError from '../pages/RouteError.jsx'

// Catches a crash in any page and shows a friendly error instead of a blank screen.
export default class ErrorBoundary extends Component {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error, info) {
    console.error(error, info.componentStack)
  }

  render() {
    return this.state.failed ? <RouteError /> : this.props.children
  }
}
