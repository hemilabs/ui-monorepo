import { readdir, readFile } from 'fs/promises'
import path from 'path'
import { describe, expect, it } from 'vitest'

const getFullKeys = (obj: Record<string, string> | string, prefix?: string) =>
  Object.keys(obj).flatMap(function (key) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    return typeof obj[key] === 'object' && obj[key] !== null
      ? getFullKeys(obj[key], fullKey)
      : fullKey
  })

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
})
