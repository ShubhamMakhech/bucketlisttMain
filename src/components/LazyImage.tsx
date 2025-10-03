
import { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  aspectRatio?: string
  fallbackSrc?: string
  blurDataURL?: string
  onClick?: () => void
}

export function LazyImage({ 
  src, 
  alt, 
  className, 
  aspectRatio = "aspect-[4/3]",
  fallbackSrc = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f3f4f6'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='%239ca3af'%3ELoading...%3C/text%3E%3C/svg%3E",
  blurDataURL = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23e5e7eb'/%3E%3C/svg%3E",
  onClick
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(false)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const [currentSrc, setCurrentSrc] = useState(blurDataURL)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (isInView && !isLoaded && !hasError) {
      const img = new Image()
      img.onload = () => {
        setCurrentSrc(src)
        setIsLoaded(true)
      }
      img.onerror = () => {
        setHasError(true)
        setCurrentSrc(fallbackSrc)
        setIsLoaded(true)
      }
      img.src = src
    }
  }, [isInView, isLoaded, hasError, src, fallbackSrc])

  return (
    <div 
      className={cn(aspectRatio, "overflow-hidden bg-muted", className)}
      onClick={onClick}
    >
      <img
        ref={imgRef}
        src={currentSrc}
        alt={alt}
        className={cn(
          "w-full h-full object-cover transition-all duration-300 ease-out",
          !isLoaded && "blur-sm scale-110",
          isLoaded && "blur-0 scale-100"
        )}
        style={{
          filter: !isLoaded ? 'blur(8px)' : 'blur(0px)',
          transform: !isLoaded ? 'scale(1.1)' : 'scale(1)',
        }}
      />
      {!isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 animate-pulse" />
      )}
    </div>
  )
}
