import React from 'react';
import PropTypes from 'prop-types';

/**
 * ErrorBoundary — catches render-time exceptions in any child component tree
 * and displays a user-friendly fallback instead of a blank screen.
 *
 * React only supports class-based error boundaries (as of React 19).
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message ?? 'Unknown error' };
  }

  componentDidCatch(error, info) {
    // In production, this could be sent to an error-reporting service
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6"
        >
          <p className="text-5xl mb-4" aria-hidden="true">⚠️</p>
          <h2 className="text-xl font-bold text-danger mb-2">Something went wrong</h2>
          <p className="text-sm text-eco-300/60 mb-6 max-w-sm leading-relaxed">
            {this.state.errorMessage}
          </p>
          <button
            onClick={this.handleReset}
            className="btn-primary"
            aria-label="Try reloading this section"
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node,
};
