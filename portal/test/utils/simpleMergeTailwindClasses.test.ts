import { simpleMergeTailwindClasses } from 'utils/simpleMergeTailwindClasses'
import { describe, it, expect } from 'vitest'

describe('mergeTailwindClasses', function () {
  it('should return all classes if no duplicates', function () {
    const result = simpleMergeTailwindClasses({
      classLists: ['px-3 py-2 text-sm bg-white'],
    })
    expect(result).toBe('px-3 py-2 text-sm bg-white')
  })

  it('should deduplicate based on px and py prefixes (default)', function () {
    const result = simpleMergeTailwindClasses({
      classLists: ['px-3 py-2', 'px-1 py-1'],
    })
    expect(result).toBe('px-1 py-1')
  })

  it('should deduplicate based on custom prefixes', function () {
    const result = simpleMergeTailwindClasses({
      classLists: [
        'shadow-md border border-red-500',
        'shadow-lg border border-blue-500',
      ],
      deduplicationPrefixes: ['shadow-', 'border'],
    })
    expect(result).toBe('shadow-lg border-blue-500')
  })

  it('should return empty string if all classLists are undefined or empty', function () {
    const result = simpleMergeTailwindClasses({
      classLists: [undefined, '', '   '],
    })
    expect(result).toBe('')
  })

  it('should keep all classes if no matching deduplication prefixes', function () {
    const result = simpleMergeTailwindClasses({
      classLists: ['text-sm font-bold', 'bg-white border'],
    })
    expect(result).toBe('text-sm font-bold bg-white border')
  })

  it('should prefer the last occurrence for deduplicated prefixes', function () {
    const result = simpleMergeTailwindClasses({
      classLists: ['px-2 py-1', 'px-6', 'py-3'],
    })
    expect(result).toBe('px-6 py-3')
  })
})
