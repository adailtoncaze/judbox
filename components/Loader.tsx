"use client"

export default function Loader({ size = 8, color = "border-indigo-600" }) {
  return (
    <div
      className={`h-${size} w-${size} animate-spin rounded-full border-4 border-gray-200 border-t-transparent ${color}`}
    />
  )
}
