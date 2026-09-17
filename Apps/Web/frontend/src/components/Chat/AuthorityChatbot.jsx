import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, X, ChevronUp, ChevronDown, CheckCircle2, AlertCircle } from 'lucide-react';
import axios from 'axios';

export default function AuthorityChatbot({ onActionExecuted }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Greetings Commander. I am your **Flood Operations AI Copilot**. I can answer situational questions or execute operational directives (e.g. broadcast warnings, ping NDRF units, optimize storm pumps, or check vehicle clearance).',
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputQuery;
    if (!text.trim()) return;

    const userMsg = {
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsSending(true);

    try {
      const res = await axios.post('/api/chat/message', { query: text });
      const botMsg = {
        sender: 'bot',
        text: res.data.reply,
        actionTaken: res.data.actionTaken,
        timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
      };
      setMessages(prev => [...prev, botMsg]);
      if (res.data.actionTaken && onActionExecuted) {
        onActionExecuted(res.data.actionTaken);
      }
    } catch (e) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: 'Error connecting to Command Copilot engine. Please retry.',
          timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
        }
      ]);
    } finally {
      setIsSending(false);
    }
  };

  const quickPrompts = [
    'What are the critical flood sectors right now?',
    'What vehicles can pass through flooded areas?',
    'Ping NDRF rescue battalion immediately',
    'Broadcast warning to Riverside Promenade',
    'Set pump station 1 to maximum capacity'
  ];

  return (
    <div className="fixed bottom-4 right-4 z-40">
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(0,229,255,0.4)] transition transform hover:scale-105 border border-cyan-400/40"
        >
          <Bot className="w-5 h-5 animate-bounce" />
          <span>Authority AI Copilot</span>
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-300 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
          </span>
        </button>
      )}

      {/* Expanded Chat Drawer */}
      {isOpen && (
        <div className="w-80 sm:w-96 bg-command-card border border-command-border rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
          {/* Header */}
          <div className="p-3 border-b border-command-border bg-command-bg/90 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-xs text-white flex items-center gap-1.5">
                  Authority Command Copilot
                  <span className="text-[9px] px-1.5 py-0.2 rounded font-mono bg-cyan-500/20 text-cyan-300">LIVE</span>
                </div>
                <div className="text-[10px] text-slate-400">Natural Language Operations & Queries</div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div ref={scrollRef} className="p-3 h-80 overflow-y-auto custom-scrollbar space-y-3 bg-command-bg/40 text-xs">
            {messages.map((m, idx) => {
              const isBot = m.sender === 'bot';
              return (
                <div key={idx} className={`flex flex-col ${isBot ? 'items-start' : 'items-end'}`}>
                  <div
                    className={`max-w-[85%] p-2.5 rounded-xl leading-relaxed ${
                      isBot
                        ? 'bg-command-bg border border-command-border text-slate-200 rounded-tl-none shadow-md'
                        : 'bg-cyan-600 text-white rounded-tr-none shadow-md'
                    }`}
                  >
                    <div className="whitespace-pre-line">{m.text}</div>
                    {m.actionTaken && (
                      <div className="mt-2 p-1.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-[10px] text-cyan-300 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                        <span>Action Executed: <b>{m.actionTaken.type}</b></span>
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-slate-500 mt-1 font-mono">{m.timestamp}</span>
                </div>
              );
            })}
            {isSending && (
              <div className="flex items-center gap-2 text-[11px] text-cyan-400">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Copilot processing operational directive...</span>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="p-2 border-t border-command-border/60 bg-command-bg/70 flex gap-1.5 overflow-x-auto custom-scrollbar">
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(p)}
                className="whitespace-nowrap px-2 py-1 rounded text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-2.5 border-t border-command-border bg-command-bg flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask Copilot or type command..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              className="flex-1 bg-command-card border border-command-border rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
            />
            <button
              type="submit"
              disabled={isSending || !inputQuery.trim()}
              className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition disabled:opacity-40"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
