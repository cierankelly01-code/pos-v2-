import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center p-6 text-center">
          <h1 className="font-heading text-2xl text-red-400 uppercase tracking-wider mb-3">
            Something went wrong
          </h1>
          <p className="font-body text-zinc-400 mb-6 max-w-md">
            This page hit an error. Other parts of the app should still work.
          </p>
          <button
            onClick={() => { window.location.href = '/'; }}
            className="min-h-[52px] px-8 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-heading uppercase tracking-wider"
          >
            Back to home
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
