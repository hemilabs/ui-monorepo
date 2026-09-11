import { ExternalLink } from 'components/externalLink'

const branch = import.meta.env.VITE_BUILD_BRANCH || 'dev'
const version = import.meta.env.VITE_BUILD_VERSION || 'dev'

const dirtyMarker = version.endsWith('-dirty') ? '-dirty' : ''
const commitSha = version.replace(/-dirty$/, '')
const commitUrl = /^[0-9a-f]{7,40}$/i.test(commitSha)
  ? `https://github.com/hemilabs/ui-monorepo/commit/${commitSha}`
  : undefined

export const BuildInfo = function () {
  const displayedVersion = commitUrl
    ? `${commitSha.slice(0, 7)}${dirtyMarker}`
    : version

  return (
    <div className="mt-1 flex w-full cursor-default items-center gap-1.5 border-t border-neutral-100 px-4 pb-0 pt-3 font-mono text-[10px] leading-4 text-neutral-400 md:px-3 md:pb-2">
      <span className="min-w-0 truncate" title={branch}>
        {branch}
      </span>
      <span aria-hidden="true" className="shrink-0">
        ·
      </span>
      {commitUrl ? (
        <ExternalLink
          className="shrink-0 transition-colors hover:text-neutral-600 hover:underline"
          href={commitUrl}
          title={version}
        >
          {displayedVersion}
        </ExternalLink>
      ) : (
        <span className="shrink-0" title={version}>
          {displayedVersion}
        </span>
      )}
    </div>
  )
}
