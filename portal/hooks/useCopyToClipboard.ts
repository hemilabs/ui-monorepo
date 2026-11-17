import { useEffect, useState } from 'react'

const copiedFeedbackMs = 3000

export const useCopyToClipboard = function () {
  const [copied, setCopied] = useState(false)

  useEffect(
    function restoreCopied() {
      if (!copied) {
        return undefined
      }
      const timeoutId = setTimeout(() => setCopied(false), copiedFeedbackMs)
      return () => clearTimeout(timeoutId)
    },
    [copied],
  )

  const copy = (text: string) =>
    Promise.resolve()
      .then(() => window.navigator.clipboard.writeText(text))
      .then(function () {
        setCopied(true)
        return true
      })
      .catch(function () {
        setCopied(false)
        return false
      })

  return { copied, copy }
}
