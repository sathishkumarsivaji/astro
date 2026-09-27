import React, { useState } from "react";
import { Send, CornerDownLeft, Sparkles, Loader2 } from "lucide-react";

export default function FollowUpQuestionInput({
  onSubmit,
  isLoading = false,
  placeholder = "Ask a question about your report...",
  isTamil = false
}) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;
    onSubmit(trimmed);
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative flex items-center bg-white rounded-2xl border border-amber-300 shadow-sm focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-400/20 transition-all p-1.5 md:p-2">
        <textarea
          rows={1}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={placeholder}
          disabled={isLoading}
          className="w-full resize-none bg-transparent px-3 py-1.5 text-xs md:text-sm text-stone-800 placeholder-stone-400 focus:outline-none max-h-32 min-h-[38px] leading-relaxed"
          style={{ height: "auto" }}
        />
        <div className="flex items-center gap-1.5 shrink-0 pr-1">
          <span className="hidden sm:inline-block text-[10px] text-stone-400 font-mono px-1">
            ↵ Enter
          </span>
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            aria-label={isTamil ? "கேள்வி கேள்" : "Ask question"}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 flex items-center gap-1.5 hover:brightness-110 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span className="hidden sm:inline">{isTamil ? "ஆராய்கிறது..." : "Evaluating..."}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 fill-amber-200 text-amber-200" />
                <span>{isTamil ? "கேள்" : "Ask"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
