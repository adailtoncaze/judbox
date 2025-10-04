"use client"
import Loader from "./Loader"

export default function GlobalLoader({ visible }: { visible: boolean }) {
  if (!visible) return null
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50">
      <Loader size={12} color="border-white" />
    </div>
  )
}
