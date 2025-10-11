"use client"

import { useState } from "react"

interface ConfirmPasswordModalProps {
  open: boolean
  onClose: () => void
  onConfirm: () => Promise<void> | void
  passwordToMatch?: string
}

export default function ConfirmPasswordModal({
  open,
  onClose,
  onConfirm,
  passwordToMatch = "judbox@2025",
}: ConfirmPasswordModalProps) {
  const [password, setPassword] = useState("")
  const [error, setError] = useState(false)

  if (!open) return null

  const handleConfirm = async () => {
    if (password !== passwordToMatch) {
      setError(true)
      setTimeout(() => setError(false), 1000)
      return
    }
    setPassword("")
    await onConfirm()
    onClose()
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white p-6 rounded-xl shadow-md w-80">
        <h2 className="text-sm font-semibold mb-3 text-gray-700">
          Confirme a exclusão
        </h2>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Digite sua senha"
          autoComplete="new-password" // 👈 evita preenchimento automático
          className={`w-full border ${error ? "border-red-500" : "border-gray-300"
            } rounded-md px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
        />
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => {
              setPassword("")
              onClose()
            }}
            className="text-gray-500 text-sm hover:text-gray-700 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="bg-indigo-600 text-white text-sm px-4 py-1.5 rounded hover:bg-indigo-700 cursor-pointer"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
