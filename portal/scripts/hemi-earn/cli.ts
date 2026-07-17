// pnpm forwards the `--` separator literally into the child process argv when
// running scripts via `pnpm run <name> -- <args>`. Node's `parseArgs` then
// treats `--` as end-of-options and rejects the following flags as positional.
// Strip a leading `--` so scripts work whether launched via node directly or
// via `pnpm run`.
export function scriptArgs() {
  const raw = process.argv.slice(2)
  return raw[0] === '--' ? raw.slice(1) : raw
}
