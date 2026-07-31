"use client";

import { MessageSquare, X } from "lucide-react";
import { useState } from "react";

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-primary text-primary-foreground p-4 rounded-full shadow-xl hover:shadow-primary/30 hover:scale-105 transition-all flex items-center justify-center"
        aria-label="Open AI Assistant"
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-80 h-96 bg-card border border-border rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          <div className="flex items-center justify-between p-4 bg-primary text-primary-foreground">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              <span className="font-bold">Aegis AI</span>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 p-4 overflow-y-auto bg-muted/20 flex flex-col gap-4">
            <div className="bg-card border border-border p-3 rounded-xl rounded-tl-sm text-sm self-start max-w-[85%] shadow-sm">
              Hello! I'm the X-Aegis AI assistant. Ask me anything about your portfolio or our vaults.
            </div>
          </div>
          
          <div className="p-3 border-t border-border bg-card">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Ask a question..." 
                className="w-full bg-muted border-none rounded-full pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary" 
              />
              <button className="absolute right-3 top-1/2 -translate-y-1/2 text-primary font-bold text-sm hover:text-primary/80 transition-colors">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
