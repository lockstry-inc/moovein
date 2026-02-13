import { useEffect, useRef } from 'react'

const KONAMI = [
  'ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight',
  'b', 'a',
]

export function useKonamiCode(onActivate: () => void) {
  const indexRef = useRef(0)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === KONAMI[indexRef.current]) {
        indexRef.current++
        if (indexRef.current === KONAMI.length) {
          indexRef.current = 0
          onActivate()
        }
      } else {
        indexRef.current = 0
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onActivate])
}
