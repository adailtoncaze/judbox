"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabaseClient"
import Image from "next/image"
import { ArrowLeftCircleIcon, HomeIcon } from "@heroicons/react/24/outline"

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
          {/* Logo + botão Dashboard */}
          <div className="flex items-center gap-4">
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

            <Link
              href="/"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
            >
              <HomeIcon className="h-5 w-5 text-white/90" />
              <span>Dashboard</span>
            </Link>
          </div>

          {/* Email + Logout */}
          <div className="flex items-center gap-3">
            {email && (
              <span className="hidden sm:inline text-sm font-medium text-indigo-100 bg-white/10 px-3 py-1 rounded-full">
                {email}
              </span>
            )}

            <button
              onClick={logout}
              className="flex items-center gap-2 text-sm font-medium text-indigo-600 bg-white hover:bg-indigo-50 px-3 py-1.5 rounded-lg shadow-sm transition cursor-pointer"
            >
              <ArrowLeftCircleIcon className="h-5 w-5 text-indigo-600" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
