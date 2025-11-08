"use client"

import { useEffect, useRef } from "react"

interface InfiniteScrollObserverProps {
  onIntersect: () => void
  hasMore: boolean
  isLoading: boolean
}

export const InfiniteScrollObserver = ({
  onIntersect,
  hasMore,
  isLoading,
}: InfiniteScrollObserverProps) => {
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel || !hasMore || isLoading) return

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries
        if (entry?.isIntersecting) {
          onIntersect()
        }
      },
      {
        rootMargin: "100px",
      }
    )

    observer.observe(sentinel)

    return () => {
      observer.disconnect()
    }
  }, [onIntersect, hasMore, isLoading])

  if (!hasMore) return null

  return (
    <div ref={sentinelRef} className="h-4 w-full" aria-hidden="true">
      {isLoading && (
        <div className="text-center text-sm text-muted-foreground">
          Carregando mais produtos...
        </div>
      )}
    </div>
  )
}

