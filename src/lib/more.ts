import { useEffect, useRef, useState } from 'react'

const PAGE = 12

/** Shows a list a page at a time; the next page loads when the end of the list scrolls into view. */
export function useMore<T>(items: T[]) {
  const [count, setCount] = useState(PAGE)
  const end = useRef<HTMLDivElement>(null)
  const more = () => setCount(c => c + PAGE)

  // A new search or muscle starts from the first page again.
  useEffect(() => setCount(PAGE), [items])

  useEffect(() => {
    const node = end.current
    if (!node || count >= items.length || typeof IntersectionObserver === 'undefined') return
    const watch = new IntersectionObserver(entries => { if (entries[0].isIntersecting) more() }, { rootMargin: '200px' })
    watch.observe(node)
    return () => watch.disconnect()
  }, [count, items])

  return { visible: items.slice(0, count), hasMore: count < items.length, more, end }
}
