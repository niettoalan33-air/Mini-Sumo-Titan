import React, { useState, useRef, useEffect } from 'react';
import { Terminal, Trash2, ArrowUpRight, ArrowDownLeft, ChevronDown, ChevronUp } from 'lucide-react';
import { CommandLogEntry } from '../types/robot';

interface CommandLogProps {
  logs: CommandLogEntry[];
  onClear: () => void;
}

export const CommandLog: React.FC<CommandLogProps> = ({ logs, onClear }) => {
  const [isOpen, setIsOpen] = useState(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, isOpen]);

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header bar */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 bg-zinc-950/80 hover:bg-zinc-950 cursor-pointer flex items-center justify-between transition-colors border-b border-zinc-800/80"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-zinc-400" />
          <span className="text-xs font-bold font-mono uppercase text-zinc-300">
            TERMINAL DE PROTOCOLO ({logs.length} EVENTOS)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {isOpen && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-zinc-800 transition-colors"
              title="Limpiar registro"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
        </div>
      </div>

      {/* Collapsible log view */}
      {isOpen && (
        <div
          ref={logContainerRef}
          className="p-3 bg-black/90 font-mono text-[11px] h-48 overflow-y-auto space-y-1 scrollbar-thin scrollbar-thumb-zinc-700"
        >
          {logs.length === 0 ? (
            <div className="text-zinc-600 italic py-2 text-center">
              Sin eventos registrados. Conecta el ESP32 o envía un comando.
            </div>
          ) : (
            logs.map((entry) => (
              <div key={entry.id} className="flex items-start gap-2 leading-relaxed">
                <span className="text-zinc-600 shrink-0 text-[10px]">
                  {entry.timestamp.toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit', fractionDigits: 3 } as Intl.DateTimeFormatOptions)}
                </span>

                {entry.direction === 'tx' ? (
                  <span className="text-red-400 font-bold shrink-0 flex items-center">
                    <ArrowUpRight className="w-3 h-3 mr-0.5 inline" />
                    TX:
                  </span>
                ) : entry.direction === 'rx' ? (
                  <span className="text-cyan-400 font-bold shrink-0 flex items-center">
                    <ArrowDownLeft className="w-3 h-3 mr-0.5 inline" />
                    RX:
                  </span>
                ) : (
                  <span className="text-amber-400 font-bold shrink-0">
                    SYS:
                  </span>
                )}

                <span
                  className={`break-all ${
                    entry.direction === 'tx'
                      ? 'text-white'
                      : entry.direction === 'rx'
                      ? 'text-zinc-300'
                      : 'text-amber-200/90'
                  }`}
                >
                  {entry.text}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
