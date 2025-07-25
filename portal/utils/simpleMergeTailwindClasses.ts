type Props = {
  classLists: (string | undefined)[]
  deduplicationPrefixes?: string[]
}

function getTailwindPropertyPrefix(cls: string, patterns: string[]) {
  for (const p of patterns) {
    if (cls.startsWith(p)) return p
  }

  return cls
}

/**
 * Simple function to merge multiple Tailwind CSS class lists into a single string, deduplicating classes
 * based on specified property prefixes. If multiple classes share the same prefix (e.g., 'px-', 'py-'),
 * only the last occurrence is kept in the result.
 *
 * @param classLists - An array of class list strings (may include undefined or falsy values).
 * @param deduplicationPrefixes - An optional array of prefixes to use for deduplication (defaults to ['px-', 'py-']).
 * @returns A single string containing the merged and deduplicated Tailwind CSS classes.
 */
export function simpleMergeTailwindClasses({
  classLists,
  deduplicationPrefixes = ['px-', 'py-'],
}: Props) {
  const allClasses = classLists
    .filter(Boolean)
    .flatMap(cls => cls!.split(/\s+/))

  const deduped = new Map<string, string>()

  for (const cls of allClasses) {
    const prefix = getTailwindPropertyPrefix(cls, deduplicationPrefixes)
    deduped.set(prefix, cls)
  }

  return Array.from(deduped.values()).join(' ')
}
