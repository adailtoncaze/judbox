"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Image from "next/image"

export default function Header() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? null))
  }, [])

  const logout = async () => {
    await supabase.auth.signOut()
    router.replace("/login")
  }

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow">
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-14 flex items-center justify-between">
          {/* Logo → Home */}
          {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logo.svg"
            alt="JudBox Logo"
            width={45}
            height={45}
            priority
          />
          <span className="text-lg font-bold text-white">JudBox</span>
        </Link>

          <div className="flex items-center gap-3">
            {email && (
              <span className="hidden sm:inline text-xs bg-white/10 px-2 py-1 rounded">
                {email}
              </span>
            )}
            <button
              onClick={logout}
              className="text-sm bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
