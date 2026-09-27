import React from "react";
import { Trash2, User, Bot, HelpCircle } from "lucide-react";
import FollowUpAnswer from "./FollowUpAnswer.jsx";

export default function FollowUpConversation({
  history = [],
  onClear = null,
  onSelectChapter = null,
  isTamil = false
}) {
  if (!history || history.length === 0) return null;

  return (
    <div className="space-y-4 pt-3 border-t border-amber-200">
      <div className="flex items-center justify-between text-xs font-semibold text-stone-600">
        <span>{isTamil ? "முந்தைய உரையாடல்" : "Conversation History"}</span>
        {onClear && (
          <button
            onClick={onClear}
            className="inline-flex items-center gap-1 text-[11px] text-stone-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
            title={isTamil ? "உரையாடலை அழிக்கவும்" : "Clear conversation history"}
          >
            <Trash2 className="w-3 h-3" />
            <span>{isTamil ? "அழி" : "Clear"}</span>
          </button>
        )}
      </div>

      <div className="space-y-3.5 max-h-[380px] overflow-y-auto pr-1">
        {history.map((turn, idx) => (
          <div key={idx} className="space-y-2">
            {/* User Question */}
            <div className="flex items-start justify-end gap-2">
              <div className="max-w-[85%] bg-amber-600 text-white rounded-2xl rounded-tr-xs px-3.5 py-2 text-xs md:text-sm font-medium shadow-xs">
                {turn.question || turn.content}
              </div>
              <div className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 text-[10px] font-bold">
                <User className="w-3.5 h-3.5 text-amber-700" />
              </div>
            </div>

            {/* Assistant Answer */}
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="max-w-[92%] flex-1">
                <FollowUpAnswer
                  answer={turn.answer || (turn.role === "assistant" ? turn.content : "")}
                  system={turn.system}
                  relevantSections={turn.relevantSections}
                  evidenceIds={turn.evidenceIds}
                  dataUsed={turn.dataUsed}
                  status={turn.status}
                  limitations={turn.limitations}
                  onSelectChapter={onSelectChapter}
                  isTamil={isTamil}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
