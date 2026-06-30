import { readdir, readFile } from 'fs/promises'
import path from 'path'
import { describe, expect, it } from 'vitest'

// Flatten nested keys into dotted paths. When `sort` is true, each object's
// keys are sorted alphabetically before recursing, yielding the expected order
// when keys are sorted per-object (the repo convention).
const getFullKeys = function (
  obj: Record<string, string> | string,
  { sort = false }: { sort?: boolean } = {},
) {
  const collect = (node: Record<string, string> | string, prefix?: string) =>
    (sort ? Object.keys(node).sort() : Object.keys(node)).flatMap(
      function (key) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        return typeof node[key] === 'object' && node[key] !== null
          ? collect(node[key], fullKey)
          : fullKey
      },
    )
  return collect(obj)
}

describe('locale messages', function () {
  describe('All locale resource files should have the same keys in the same order', function () {
    it('should have the same keys in the same order', async function () {
      // get the directory file names
      const messagesDir = path.resolve(__dirname, '../messages')
      const files = await readdir(messagesDir)

      // read the file, and get its keys into an array
      const keysArrays = await Promise.all(
        files.map(async function (file) {
          const filePath = path.join(messagesDir, file)
          const content = JSON.parse(await readFile(filePath, 'utf-8'))
          return getFullKeys(content)
        }),
      )

      // compare all keys arrays with the first one - by transitivity, all should be equal
      keysArrays.forEach(keysArray => expect(keysArray).toEqual(keysArrays[0]))
    })
  })

  describe('English locale keys should be sorted alphabetically', function () {
    it('should have all keys sorted alphabetically', async function () {
      const englishFilePath = path.resolve(__dirname, '../messages/en.json')
      const content = JSON.parse(await readFile(englishFilePath, 'utf-8'))
      const keys = getFullKeys(content)
      const sortedKeys = getFullKeys(content, { sort: true })

      expect(keys).toEqual(sortedKeys)
    })
  })
})
