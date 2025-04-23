'use client'

import * as Sentry from '@sentry/nextjs'
import { GenericError } from 'components/genericError'
import React from 'react'

type Props = {
  children: React.ReactNode
  fallback?: React.ReactNode
}

type State = {
  hasError: boolean
}

// See https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  componentDidCatch(error: Error) {
    // Capture the error with Sentry
    Sentry.captureException(error)
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <GenericError />
    }

    return this.props.children
  }
}
