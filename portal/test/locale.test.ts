import { glob, readdir, readFile } from 'fs/promises'
import path from 'path'
import { type AbstractIntlMessages, type Messages } from 'use-intl'
import { describe, expect, it } from 'vitest'

// Flatten nested keys into dotted paths. When `sort` is true, each object's
// keys are sorted alphabetically before recursing, yielding the expected order
// when keys are sorted per-object (the repo convention).
const getFullKeys = function (
  obj: AbstractIntlMessages,
  { sort = false }: { sort?: boolean } = {},
) {
  const collect = (node: AbstractIntlMessages, prefix?: string): string[] =>
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

const dynamicallyReferencedKeys = [
  'connect-wallets.status.connected',
  'connect-wallets.status.connecting',
  'connect-wallets.status.reconnecting',
  'hemi-stake.analytics.circulating',
  'hemi-stake.analytics.non-circulating',
  'hemi-stake.analytics.staked',
  'hemi-stake.form.lockup-increment-warning',
  'metadata.title',
]

type SourceFile = {
  literals: Set<string>
  namespaces: string[]
  templates: RegExp[]
}

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const toTemplatePattern = (template: string) =>
  new RegExp(
    `^${template
      .split(/\$\{[^}]*\}/)
      .map(escapeRegExp)
      .join('.+')}$`,
  )

const parseSourceFile = function (content: string): SourceFile {
  const literals = Array.from(
    content.matchAll(/(['"`])([^'"`\s]+)\1/g),
    match => match[2],
  )
  return {
    literals: new Set(literals),
    namespaces: Array.from(
      content.matchAll(
        /useTranslations(?:<(?:'([^']*)'|never)>|\(\s*(?:'([^']*)')?\s*\))/g,
      ),
      match => match[1] ?? match[2] ?? '',
    ),
    templates: literals
      .filter(literal => /\$\{[^}]*\}/.test(literal))
      .filter(literal => /[\w-]/.test(literal.replace(/\$\{[^}]*\}/g, '')))
      .map(toTemplatePattern),
  }
}

const isReferenced = ({
  key,
  sourceFiles,
}: {
  key: string
  sourceFiles: SourceFile[]
}) =>
  sourceFiles.some(({ literals, namespaces, templates }) =>
    namespaces
      .filter(namespace => namespace === '' || key.startsWith(`${namespace}.`))
      .map(namespace => (namespace ? key.slice(namespace.length + 1) : key))
      .some(
        relativeKey =>
          literals.has(relativeKey) ||
          templates.some(template => template.test(relativeKey)),
      ),
  )

const readEnglishMessages = async function () {
  const englishFilePath = path.resolve(__dirname, '../messages/en.json')
  return JSON.parse(await readFile(englishFilePath, 'utf-8')) as Messages
}

const readSourceFiles = async function () {
  const portalDir = path.resolve(__dirname, '..')
  const sourceFiles = await Array.fromAsync(
    glob('**/*.{ts,tsx}', {
      cwd: portalDir,
      exclude: ['dist', 'node_modules', 'out', 'stories', 'test'],
    }),
  )
  const contents = await Promise.all(
    sourceFiles.map(file => readFile(path.join(portalDir, file), 'utf-8')),
  )
  return contents.map(parseSourceFile)
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
      const content = await readEnglishMessages()
      const keys = getFullKeys(content)
      const sortedKeys = getFullKeys(content, { sort: true })

      expect(keys).toEqual(sortedKeys)
    })
  })

  describe('English locale keys should all be referenced in the source code', function () {
    it('should not have unused keys', async function () {
      const keys = getFullKeys(await readEnglishMessages())
      const sourceFiles = await readSourceFiles()

      const unusedKeys = keys.filter(
        key =>
          !dynamicallyReferencedKeys.includes(key) &&
          !isReferenced({ key, sourceFiles }),
      )

      expect(unusedKeys).toEqual([])
    })

    it('should not allow-list keys that no longer exist', async function () {
      const keys = getFullKeys(await readEnglishMessages())

      const staleKeys = dynamicallyReferencedKeys.filter(
        key => !keys.includes(key),
      )

      expect(staleKeys).toEqual([])
    })
  })
})
