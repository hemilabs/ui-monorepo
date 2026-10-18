import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const source = readFileSync(
  join(root, 'app', '[locale]', 'hemi-earn', 'page.tsx'),
  'utf8',
)

const gate = (source.match(/const TokensGate[\s\S]*?\n}\n/) ?? [])[0] ?? ''

describe('TokensGate error branch (#2473)', function () {
  it('renders an error card with Try again that refetches, instead of null', function () {
    expect(gate).toContain('isError')
    expect(gate).not.toMatch(/if \(isError\) return null/)
    expect(gate).toContain('role="alert"')
    expect(gate).toContain('common.unexpected-error')
    expect(gate).toContain('common.try-again')
    expect(gate).toMatch(/onClick=\{\(\) => refetch\(\)\}/)
    expect(gate).toContain('refetch')
  })

  it('keeps rendering children when there is no error', function () {
    expect(gate).toContain('return <>{children}</>')
  })
})
