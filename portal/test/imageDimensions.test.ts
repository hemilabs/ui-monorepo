import { protocolImages } from 'app/[locale]/stake/protocols/protocolImages'
import { error404 } from 'app/_images/error404'
import { errorArtwork } from 'components/error500/errorArtwork'
import { gradientLoading } from 'components/reviewOperation/_images/gradientLoading'
import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

// The `width`/`height` declared next to each image define the aspect ratio the
// browser reserves before the asset loads. next/image derived them from the
// file, so they could not drift; now they are written by hand, and the modules
// asserted here are the same ones the components render from.

const rootSvgTag = function (svg: string) {
  const tag = /<svg\b[^>]*>/.exec(svg)
  if (!tag) {
    throw new Error('no <svg> element found')
  }
  return tag[0]
}

// Only the root tag is scanned: `stroke-width` on a child matches a bare
// /width=/ and would silently win over the viewBox fallback.
const svgSize = function (svg: string) {
  const tag = rootSvgTag(svg)
  const width = /[\s]width=['"]([\d.]+)/.exec(tag)
  const height = /[\s]height=['"]([\d.]+)/.exec(tag)
  if (width && height) {
    return { height: +height[1], width: +width[1] }
  }
  const viewBox =
    /viewBox=['"]\s*[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)/.exec(tag)
  if (!viewBox) {
    throw new Error(`no width/height and no usable viewBox in ${tag}`)
  }
  return { height: +viewBox[2], width: +viewBox[1] }
}

const pngSize = (bytes: Buffer) => ({
  height: bytes.readUInt32BE(20),
  width: bytes.readUInt32BE(16),
})

// Vite serves an asset as a path or inlines it as a data URI, and small SVGs
// come back base64 encoded whenever they contain <text>, <foreignObject> or a
// nested quote.
const intrinsicSize = function (src: string) {
  const svgUtf8 = 'data:image/svg+xml,'
  const svgBase64 = 'data:image/svg+xml;base64,'
  if (src.startsWith(svgBase64)) {
    return svgSize(
      Buffer.from(src.slice(svgBase64.length), 'base64').toString('utf8'),
    )
  }
  if (src.startsWith(svgUtf8)) {
    return svgSize(decodeURIComponent(src.slice(svgUtf8.length)))
  }
  if (src.startsWith('data:image/png;base64,')) {
    return pngSize(Buffer.from(src.split(',')[1], 'base64'))
  }
  const file = join(__dirname, '..', decodeURIComponent(src))
  return src.endsWith('.png')
    ? pngSize(readFileSync(file))
    : svgSize(readFileSync(file, 'utf8'))
}

describe('declared image dimensions', function () {
  describe('protocolImages', function () {
    it.each(Object.entries(protocolImages))(
      '%s matches its asset',
      function (_protocol, { height, src, width }) {
        expect(intrinsicSize(src)).toEqual({ height, width })
      },
    )
  })

  it.each([
    { image: error404, name: '404.svg' },
    { image: errorArtwork, name: '500.svg' },
    { image: gradientLoading, name: 'gradient_loading.png' },
  ])(
    '$name matches the dimensions declared alongside it',
    function ({ image }) {
      const { height, src, width } = image
      expect(intrinsicSize(src)).toEqual({ height, width })
    },
  )
})
