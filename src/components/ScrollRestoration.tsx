import React from 'react'
import { useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigationType } from 'react-router-dom'

const SCROLL_KEY = 'app:scrollpos:'
const PAGE_STATE_KEY = 'app:pagestate:'

// Hook to let pages save/restore arbitrary per-history-entry state
export function usePageState() {
  const location = useLocation()
  const key = location.key || `${location.pathname}${location.search}`

  const save = useCallback((state: any) => {
    try {
      sessionStorage.setItem(PAGE_STATE_KEY + key, JSON.stringify(state))
    } catch (e) {
      console.warn('usePageState save failed', e)
    }
  }, [key])

  const restore = useCallback(() => {
    try {
      const raw = sessionStorage.getItem(PAGE_STATE_KEY + key)
      return raw ? JSON.parse(raw) : null
    } catch (e) {
      console.warn('usePageState restore failed', e)
      return null
    }
  }, [key])

  return { save, restore }
}

// Global scroll restoration component.
// - saves scroll position for the previous location on navigation
// - restores scroll position when navigation type is POP (back/forward)
export default function ScrollRestoration() {
  const location = useLocation()
  const navigationType = useNavigationType()
  const prevLocation = useRef(location)

  useEffect(() => {
    // Save scroll position for the previous location entry
    try {
      const prev = prevLocation.current
      if (prev) {
        const prevKey = prev.key || `${prev.pathname}${prev.search}`
        const pos = { x: window.scrollX || 0, y: window.scrollY || 0 }
        sessionStorage.setItem(SCROLL_KEY + prevKey, JSON.stringify(pos))
        // debug: record that we saved a scroll pos for previous entry
        try { console.debug('ScrollRestoration: saved', prevKey, pos) } catch {}
      }
    } catch (e) {
      console.warn('ScrollRestoration save previous failed', e)
    }

    prevLocation.current = location

    // On back/forward (POP), restore the saved scroll position for this location
    if (navigationType === 'POP') {
      try {
        const key = location.key || `${location.pathname}${location.search}`
        const raw = sessionStorage.getItem(SCROLL_KEY + key)
        try { console.debug('ScrollRestoration: attempting restore', { navigationType, key, rawExists: !!raw }) } catch {}
        if (raw) {
          const { x = 0, y = 0 } = JSON.parse(raw)

          // Try a few strategies to restore scroll after navigation and layout:
          // 1) Immediately (in next macrotask)
          // 2) on next animation frame
          // 3) retry once after a short timeout — this handles cases where content
          //    is rendered asynchronously (images, network data, or lazy components).
          const doScroll = () => {
            try { window.scrollTo({ left: x, top: y, behavior: 'auto' }) } catch (err) { console.warn('scrollTo failed', err) }
          }

          setTimeout(() => {
            try {
              doScroll()
              // also ensure at next frame
              requestAnimationFrame(() => doScroll())
            } catch (err) { console.warn('ScrollRestoration deferred scroll failed', err) }
          }, 0)

          // final retry in 120ms to handle late-rendering content
          setTimeout(() => {
            try { doScroll() } catch (err) { console.warn('ScrollRestoration retry scroll failed', err) }
          }, 120)
        }
      } catch (e) {
        console.warn('ScrollRestoration restore failed', e)
      }
    }
    // do not run on initial mount only when location changes
  }, [location, navigationType])

  // Also persist on beforeunload to handle full reloads
  useEffect(() => {
    const saveNow = () => {
      try {
        const key = location.key || `${location.pathname}${location.search}`
        const pos = { x: window.scrollX || 0, y: window.scrollY || 0 }
        sessionStorage.setItem(SCROLL_KEY + key, JSON.stringify(pos))
      } catch (err) { console.warn('ScrollRestoration beforeunload save failed', err) }
    }
    window.addEventListener('beforeunload', saveNow)
    return () => window.removeEventListener('beforeunload', saveNow)
  }, [location])

  return null
}
