import { useEffect, useRef, useState } from 'react'

/**
 * Search-box state for server-side search.
 *
 * `input` is what the text field shows; `query` is the trimmed value to send to
 * the server, updated `delay` ms after the user stops typing. `onCommit` runs
 * at that moment, so the page can jump back to page 1 for the new result set.
 */
export function useDebouncedSearch(onCommit, delay = 300) {
  const [input, setInput] = useState('')
  const [query, setQuery] = useState('')
  const timer = useRef(null)

  useEffect(() => () => clearTimeout(timer.current), [])

  const onChange = (value) => {
    setInput(value)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      setQuery(value.trim())
      onCommit?.()
    }, delay)
  }

  return { input, query, onChange }
}
