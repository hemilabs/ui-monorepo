import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { type Abi, type Hex } from 'viem'

type Artifact = {
  abi: Abi
  bytecode: Hex
}

const artifactsDir = join(dirname(fileURLToPath(import.meta.url)), 'artifacts')

export function loadArtifact(name: string) {
  const path = join(artifactsDir, `${name}.json`)
  const raw = readFileSync(path, 'utf8')
  try {
    return JSON.parse(raw) as Artifact
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Failed to parse artifact ${path}: ${message}`)
  }
}
