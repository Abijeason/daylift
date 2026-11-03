import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import type { RefObject } from 'react'

gsap.registerPlugin(useGSAP, ScrollTrigger, SplitText)

const EASE = 'expo.out'

export function countTo(text: string): number | null {
  const digits = text.replace(/,/g, '')
  return /^\d+$/.test(digits) ? Number(digits) : null
}

/**
 * Entrance and scroll motion for a screen. Mark elements with:
 * data-split (headline letters rise), data-count (number counts up),
 * data-reveal (fades up on scroll), data-parallax (drifts on scroll),
 */
export function useScreenMotion(scope: RefObject<HTMLElement | null>, dependencies: unknown[] = []) {
  useGSAP(() => {
    const root = scope.current
    // Test runners and very old browsers skip motion and show the final layout.
    if (!root || typeof window.matchMedia !== 'function') return

    gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
      const reveals = gsap.utils.toArray<HTMLElement>('[data-reveal]', root)
      const entering = gsap.utils.toArray<HTMLElement>(':scope > *', root).filter(el => !el.hasAttribute('data-reveal'))

      gsap.from(entering, { y: 18, autoAlpha: 0, duration: 0.6, ease: EASE, stagger: 0.05 })

      gsap.utils.toArray<HTMLElement>('[data-split]', root).forEach(el => {
        SplitText.create(el, {
          type: 'words,chars',
          mask: 'chars',
          autoSplit: true,
          onSplit: self => gsap.from(self.chars, { yPercent: 110, duration: 0.8, ease: EASE, stagger: 0.022, delay: 0.05 }),
        })
      })

      gsap.set(reveals, { y: 16, autoAlpha: 0 })
      ScrollTrigger.batch(reveals, {
        start: 'top 94%',
        once: true,
        onEnter: batch => gsap.to(batch, { y: 0, autoAlpha: 1, duration: 0.6, ease: EASE, stagger: 0.06 }),
      })

      gsap.utils.toArray<HTMLElement>('[data-count]', root).forEach(el => {
        const text = el.firstChild
        const target = countTo(el.textContent ?? '')
        if (!target || !text) return
        const value = { n: 0 }
        // Update the existing text node so React keeps ownership of it.
        gsap.to(value, {
          n: target,
          duration: 1.2,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 95%', once: true },
          onUpdate: () => { text.nodeValue = Math.round(value.n).toLocaleString() },
        })
        text.nodeValue = '0'
      })

      gsap.utils.toArray<HTMLElement>('[data-parallax]', root).forEach(el => {
        gsap.to(el, { yPercent: -10, ease: 'none', scrollTrigger: { trigger: el, start: 'clamp(top top+=80)', end: 'bottom top', scrub: 0.3 } })
      })

    })
  }, { scope, dependencies, revertOnUpdate: true })
}
