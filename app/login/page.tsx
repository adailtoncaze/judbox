"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { useToast } from "@/hooks/useToast"

export default function LoginPage() {
  const router = useRouter()
  const { showToast } = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)

  const inputClass =
    "w-full border border-gray-200 rounded-md px-3 py-2 text-sm bg-gray-50 outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-colors"

  useEffect(() => {
    // Se já estiver logado, manda para a home
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

    // Sem toast de sucesso
    router.replace("/")
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-white to-indigo-50">
      {/* BG decor sutil */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-16 -left-16 h-64 w-64 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl" />
      </div>

      {/* Conteúdo centralizado */}
      <main className="min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="bg-white/90 backdrop-blur rounded-2xl shadow p-6 sm:p-7">
            <h1 className="text-xl font-semibold text-gray-800 text-center">Entrar</h1>
            <p className="text-sm text-gray-500 mt-1 text-center">
              Acesse com seu e-mail e senha definidos no sistema.
            </p>

            <form onSubmit={onSubmit} className="mt-5 space-y-3">
              <div>
                <label htmlFor="email" className="block text-xs mb-1 text-gray-700">
                  E-mail
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="username"
                  className={inputClass}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-xs mb-1 text-gray-700">
                  Senha
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPass ? "text" : "password"}
                    autoComplete="current-password"
                    className={inputClass + " pr-10"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute inset-y-0 right-0 px-3 text-xs text-gray-500 hover:text-gray-700"
                    aria-label={showPass ? "Ocultar senha" : "Mostrar senha"}
                  >
                    {showPass ? "Ocultar" : "Mostrar"}
                  </button>
                </div>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full inline-flex justify-center items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-2 disabled:opacity-60"
                >
                  {loading ? "Entrando..." : "Entrar"}
                </button>
              </div>
            </form>

            <div className="mt-4 text-[12px] text-gray-500 text-center">
              Precisa de acesso? Fale com o administrador.
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
