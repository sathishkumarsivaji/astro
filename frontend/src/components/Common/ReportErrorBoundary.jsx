import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default class ReportErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ReportErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const isTamil = this.props.lang === "ta";
      return (
        <div className="p-6 md:p-8 rounded-3xl bg-amber-50/90 border border-amber-300 text-stone-800 text-center space-y-4 my-6 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <h3 className="text-base font-serif font-bold text-stone-900">
            {isTamil ? "அறிக்கையைப் பகிர்வதில் பிழை ஏற்பட்டது" : "Unable to Load This Report Section"}
          </h3>
          <p className="text-xs text-stone-600 max-w-md mx-auto leading-relaxed">
            {isTamil
              ? "இந்த ஜோதிட அத்தியாயத்தை ஏற்றுவதில் எதிர்பாராத பிழை ஏற்பட்டது. தயவுசெய்து பக்கத்தைப் புதுப்பிக்கவும் அல்லது வேறு அத்தியாயத்தைத் தேர்ந்தெடுக்கவும்."
              : "An unexpected issue occurred while rendering this astrological report section. You can refresh or switch to another chapter."}
          </p>
          {this.state.error && (
            <pre className="text-[10px] font-mono text-stone-500 bg-white/80 p-2.5 rounded-xl max-w-md mx-auto overflow-x-auto text-left border border-amber-200">
              {this.state.error.message || String(this.state.error)}
            </pre>
          )}
          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={this.handleReset}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>{isTamil ? "மீண்டும் முயற்சி செய்" : "Try Again"}</span>
            </button>
            {this.props.onClose && (
              <button
                onClick={this.props.onClose}
                className="px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs transition-all cursor-pointer"
              >
                {isTamil ? "மூடு" : "Close"}
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
