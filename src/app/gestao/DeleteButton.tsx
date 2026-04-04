"use client";

import { Trash2 } from "lucide-react";

export function DeleteButton() {
  return (
    <button 
      type="submit" 
      className="py-1.5 px-3 rounded text-xs font-medium bg-red-100 text-red-700 hover:bg-red-200 flex items-center transition"
      onClick={(e) => {
        if (!confirm('Tem certeza? Isso apagará a igreja, eventos e desligará os usuários!')) {
          e.preventDefault();
        }
      }}
    >
      <Trash2 className="w-3 h-3 mr-1" /> Apagar
    </button>
  );
}
