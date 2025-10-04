"use client"

export function SkeletonTable({ rows = 5 }) {
  return (
    <tbody className="animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="bg-white">
          <td colSpan={7} className="px-4 py-3">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </td>
        </tr>
      ))}
    </tbody>
  )
}
