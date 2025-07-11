import React, { useState, useEffect, useRef } from 'react';

interface UrlInputProps {
  coords: DOMRect;
  onSave: (url: string) => void;
  onCancel: () => void;
  initialUrl?: string;
}

export default function UrlInput({ coords, onSave, onCancel, initialUrl }: UrlInputProps): React.ReactNode {
  const [url, setUrl] = useState(initialUrl || 'https://');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(url.trim().length > 8 && (url.startsWith('http://') || url.startsWith('https://'))) {
        onSave(url);
    } else {
        alert("Por favor, insira uma URL válida começando com http:// ou https://");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const popoverStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${coords.x}px`,
      top: `${coords.y + coords.height + 5}px`, // Position below the rectangle
      zIndex: 50,
  }

  return (
    <div style={popoverStyle} className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-2xl border border-slate-300 dark:border-slate-600">
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <label htmlFor="url-input" className="font-semibold text-sm">URL:</label>
        <input
          ref={inputRef}
          id="url-input"
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-64 p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition-colors">
          Salvar
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
          Cancelar
        </button>
      </form>
    </div>
  );
}