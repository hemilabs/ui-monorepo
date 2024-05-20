'use client'

import { GenericError } from 'components/genericError'
import React from 'react'

type Props = {
  children: React.ReactNode
}

type State = {
  hasError: boolean
}

// See https://react.dev/reference/react/Component#catching-rendering-errors-with-an-error-boundary
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    // Update state so the next render will show the fallback UI.
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <GenericError />
    }

    return this.props.children
  }
}
