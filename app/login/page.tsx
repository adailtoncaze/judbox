"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/useToast"
import {
  EnvelopeIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightOnRectangleIcon,
} from "@heroicons/react/24/outline"

export default function LoginPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const inputClass =
    "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/")
    })
  }, [router])

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      showToast("Credenciais inválidas.", "error")
      setLoading(false)
      return
    }

    router.replace("/")
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* BG decorativo sutil */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
      </div>

      {/* Conteúdo centralizado */}
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow-xl p-8 space-y-6">
            {/* Logo com destaque sutil */}
            <div className="flex flex-col items-center gap-3">
              <Image
                src="/logo.svg"
                alt="JudBox Logo"
                width={120}
                height={120}
                priority
                className="opacity-95 drop-shadow-sm"
              />
              <h1 className="text-2xl font-bold text-gray-800">JudBox</h1>
              
              <p className="text-sm text-gray-500">Acesse com suas credenciais do sistema</p>
            </div>

            {/* Formulário */}
            <form onSubmit={onSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="email" className="block text-xs mb-1 text-gray-700">
                  E-mail
                </label>
                <div className="relative">
                  <EnvelopeIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="username"
                    className={inputClass + " pl-10"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs mb-1 text-gray-700">
                  Senha
                </label>
                <div className="relative">
                  <LockClosedIcon className="h-5 w-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    className={inputClass + " pl-10 pr-10"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-gray-600"
                    aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPass ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 disabled:opacity-60 transition"
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </div>
            </form>

            {/* Rodapé */}
            <div className="pt-2 text-[12px] text-gray-500 text-center">
              Precisa de acesso? Fale com o administrador.
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
