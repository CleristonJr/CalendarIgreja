"use client"

import { useState } from 'react'
import { Key } from 'lucide-react'
import { gerarSenhaTemporaria } from './actions'

export function ResetPasswordButton({ userId }: { userId: string }) {
  const [loading, setLoading] = useState(false)
  const [tempPass, setTempPass] = useState('')

  async function handleReset() {
    if (!confirm("Tem certeza que deseja forçar o reset de senha deste líder?")) return;
    
    setLoading(true)
    try {
      const resp = await gerarSenhaTemporaria(userId)
      if (resp?.success && resp.password) {
        setTempPass(resp.password)
        alert(`SUCESSO! Copie a senha temporária gerada: ${resp.password}\n\nEnvie para o pastor, ele será forçado a criar uma nova ao logar.`)
      } else {
        alert(resp?.error || "Ocorreu um erro ao resetar a senha.")
      }
    } catch (e: any) {
      alert(e.message)
    }
    setLoading(false)
  }

  return tempPass ? (
    <span className="font-mono bg-yellow-100 border border-yellow-300 text-yellow-800 text-xs px-3 py-1.5 rounded font-bold shadow-sm">
      Nova senha: {tempPass}
    </span>
  ) : (
    <button 
      onClick={handleReset} 
      disabled={loading} 
      className="py-1.5 px-4 flex items-center rounded text-xs font-bold transition shadow-sm bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
    >
      <Key className="w-3.5 h-3.5 mr-1" />
      {loading ? "Resetando..." : "Forçar Reset de Senha"}
    </button>
  )
}
