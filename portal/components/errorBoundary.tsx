import * as Sentry from '@sentry/react'
import { GenericError } from 'components/genericError'
import React from 'react'

type FallbackProps = {
  reset: VoidFunction
}

type Props = {
  children: React.ReactNode
  fallback?: React.ReactNode | ((props: FallbackProps) => React.ReactNode)
}

type State = {
  hasError: boolean
}

// See https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
export class ErrorBoundary extends React.Component<Props, State> {
  componentDidCatch(error: Error) {
    // Capture the error with Sentry
    Sentry.captureException(error)
  }

  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true }
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const { fallback } = this.props
    if (typeof fallback === 'function') {
      return fallback({ reset: this.reset })
    }

    return fallback ?? <GenericError />
  }

  reset = () => this.setState({ hasError: false })
}
