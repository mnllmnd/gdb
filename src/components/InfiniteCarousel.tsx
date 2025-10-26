import React from 'react'

interface Props {
  children: React.ReactNode
  speed?: number // pixels per second
  mobileSpeed?: number
  resumeDelay?: number // ms
}

const InfiniteCarousel: React.FC<Props> = ({ children, speed = 40, mobileSpeed, resumeDelay = 1200 }) => {
  const containerRef = React.useRef<HTMLDivElement | null>(null)
  const contentRef = React.useRef<HTMLDivElement | null>(null)
  const positionRef = React.useRef<number>(0)
  const contentWidthRef = React.useRef<number>(0)
  const isPausedRef = React.useRef<boolean>(false)
  const pauseTimeoutRef = React.useRef<number | null>(null)

  // interaction
  const startXRef = React.useRef<number | null>(null)
  const startYRef = React.useRef<number | null>(null)
  const startPosRef = React.useRef<number>(0)
  const isDraggingRef = React.useRef<boolean>(false)
  const isInteractingRef = React.useRef<boolean>(false)
  const resumeTimerRef = React.useRef<number | null>(null)

  // momentum on release
  const velocityRef = React.useRef<number>(0) // px per ms
  const lastMoveTimeRef = React.useRef<number | null>(null)
  const lastMoveXRef = React.useRef<number | null>(null)

  // determine speed by breakpoint
  const getAdjustedSpeed = () => {
    try {
      const width = window.innerWidth
      if (width <= 768) return mobileSpeed ?? speed * 0.6
      if (width <= 1024) return mobileSpeed ?? speed * 0.8
    } catch (e) {}
    return speed
  }

  React.useEffect(() => {
    const content = contentRef.current
    if (!content) return

    const measure = () => {
      try {
        contentWidthRef.current = Math.max(1, content.scrollWidth / 2)
      } catch (e) {
        contentWidthRef.current = 0
      }
    }
    measure()
    let ro: ResizeObserver | null = null
    try {
      ro = new ResizeObserver(measure)
      ro.observe(content)
    } catch (e) { ro = null }

    let lastTime: number | null = null
    let raf = 0

    const animate = (time: number) => {
      if (!lastTime) lastTime = time
      const dt = Math.min(40, time - lastTime)
      lastTime = time

      const sp = getAdjustedSpeed()

      // if user is not interacting and not paused, advance by speed
      if (!isPausedRef.current && !isInteractingRef.current && contentWidthRef.current > 0) {
        positionRef.current += (dt * sp) / 1000
      }

      // apply momentum if present
      if (!isInteractingRef.current && Math.abs(velocityRef.current) > 0.0001) {
        // simple decay
        positionRef.current -= velocityRef.current * dt
        velocityRef.current *= 0.92
        if (Math.abs(velocityRef.current) < 0.001) velocityRef.current = 0
      }

      if (contentWidthRef.current > 0) {
        const w = contentWidthRef.current
        if (positionRef.current >= w) positionRef.current -= w
        if (positionRef.current < 0) positionRef.current += w
      }

      if (contentRef.current) contentRef.current.style.transform = `translate3d(${-positionRef.current}px,0,0)`

      raf = requestAnimationFrame(animate)
    }

    raf = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(raf)
      if (ro) try { ro.disconnect() } catch (e) { /* ignore */ }
      if (pauseTimeoutRef.current) window.clearTimeout(pauseTimeoutRef.current)
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current)
    }
  }, [speed, mobileSpeed])

  const handlePointerDown = (e: React.PointerEvent) => {
    startXRef.current = e.clientX
    startYRef.current = e.clientY
    startPosRef.current = positionRef.current
    lastMoveTimeRef.current = performance.now()
    lastMoveXRef.current = e.clientX
    velocityRef.current = 0
    isDraggingRef.current = false
    // cancel resume
    if (resumeTimerRef.current) { window.clearTimeout(resumeTimerRef.current); resumeTimerRef.current = null }
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    const sx = startXRef.current
    const sy = startYRef.current
    if (sx == null || sy == null) return
    const dx = e.clientX - sx
    const dy = e.clientY - sy

    if (!isDraggingRef.current && !isInteractingRef.current) {
      const absDx = Math.abs(dx)
      const absDy = Math.abs(dy)
      const threshold = 8
      if (absDx > threshold && absDx > absDy * 1.5) {
        isDraggingRef.current = true
        isInteractingRef.current = true
        isPausedRef.current = true
        // capture pointer
        try { (e.target as Element).setPointerCapture((e as any).pointerId) } catch (err) {}
        // disable child pointer-events to avoid hover
        const c = contentRef.current
        if (c) Array.from(c.children).forEach(ch => { (ch as HTMLElement).style.pointerEvents = 'none' })
      } else if (absDy > threshold && absDy > absDx * 1.5) {
        // vertical gesture
        isDraggingRef.current = false
        isInteractingRef.current = false
        return
      } else return
    }

    if (!isDraggingRef.current) return
    e.preventDefault()

    const newPos = startPosRef.current - dx
    const w = contentWidthRef.current || (contentRef.current ? contentRef.current.scrollWidth / 2 : 0)
    if (w > 0) {
      positionRef.current = ((newPos % w) + w) % w
    } else {
      positionRef.current = newPos
    }
    if (contentRef.current) contentRef.current.style.transform = `translate3d(${-positionRef.current}px,0,0)`

    // update velocity
    const now = performance.now()
    if (lastMoveTimeRef.current != null && lastMoveXRef.current != null) {
      const dt = Math.max(1, now - lastMoveTimeRef.current)
      velocityRef.current = (e.clientX - lastMoveXRef.current) / dt // px per ms
    }
    lastMoveTimeRef.current = now
    lastMoveXRef.current = e.clientX
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current || isInteractingRef.current) {
      // apply momentum based on last velocity (px/ms)
      // positive velocityRef means finger moving right; we want to move content left when swiping right, so invert
      velocityRef.current = -(velocityRef.current || 0) * 0.8
      // schedule resume after delay
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current)
      resumeTimerRef.current = window.setTimeout(() => {
        isPausedRef.current = false
        resumeTimerRef.current = null
      }, resumeDelay)
      // re-enable children pointer events
      const c = contentRef.current
      if (c) Array.from(c.children).forEach(ch => { (ch as HTMLElement).style.pointerEvents = '' })
    }

    isDraggingRef.current = false
    isInteractingRef.current = false
    startXRef.current = null
    startYRef.current = null
    lastMoveTimeRef.current = null
    lastMoveXRef.current = null
    try { (e.target as Element).releasePointerCapture((e as any).pointerId) } catch (err) { /* ignore */ }
  }

  const handleClick = () => {
    isPausedRef.current = true
    if (pauseTimeoutRef.current) window.clearTimeout(pauseTimeoutRef.current)
    pauseTimeoutRef.current = window.setTimeout(() => { isPausedRef.current = false }, 2000)
  }

  return (
    <div
      ref={containerRef}
      style={{ overflow: 'hidden', position: 'relative', touchAction: 'pan-y' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onClick={handleClick}
    >
      <div
        ref={contentRef}
        style={{ display: 'flex', transform: 'translate3d(0,0,0)', willChange: 'transform' }}
      >
        {children}
        {children}
      </div>
    </div>
  )
}

export default InfiniteCarousel
