"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const check = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) router.replace("/login")
      else setChecking(false)
    }
    check()

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, session) => {
      if (!session?.user) router.replace("/login")
    })
    return () => { sub.subscription.unsubscribe() }
  }, [router])

  if (checking) {
    return <div className="min-h-[50vh] flex items-center justify-center text-gray-600">Verificando sessão...</div>
  }
  return <>{children}</>
}
