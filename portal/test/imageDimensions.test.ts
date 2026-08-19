import { protocolImages } from 'app/[locale]/stake/protocols/protocolImages'
import error404 from 'app/_images/404.svg'
import svg500 from 'components/error500/500.svg'
import gradientLoading from 'components/reviewOperation/_images/gradient_loading.png'
import { readFileSync } from 'fs'
import { join } from 'path'
import { describe, expect, it } from 'vitest'

// The `width`/`height` declared next to each image define the aspect ratio the
// browser reserves before the asset loads. next/image derived them from the
// file, so they could not drift; now they are written by hand and nothing else
// would catch a swapped asset.

const svgSize = function (svg: string) {
  const width = /\bwidth=['"]([\d.]+)/.exec(svg)
  const height = /\bheight=['"]([\d.]+)/.exec(svg)
  if (width && height) {
    return { height: Math.round(+height[1]), width: Math.round(+width[1]) }
  }
  const viewBox = /viewBox=['"][\d.-]+ +[\d.-]+ +([\d.]+) +([\d.]+)/.exec(svg)
  return {
    height: Math.round(+viewBox![2]),
    width: Math.round(+viewBox![1]),
  }
}

const pngSize = (bytes: Buffer) => ({
  height: bytes.readUInt32BE(20),
  width: bytes.readUInt32BE(16),
})

// Vite inlines small assets as a data URI and emits the rest as a path rooted
// at the portal directory, so both shapes reach the app.
const intrinsicSize = function (src: string) {
  const svgDataUri = 'data:image/svg+xml,'
  if (src.startsWith(svgDataUri)) {
    return svgSize(decodeURIComponent(src.slice(svgDataUri.length)))
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
    { height: 402, name: '404.svg', src: error404, width: 973 },
    { height: 349, name: '500.svg', src: svg500, width: 941 },
    {
      height: 20,
      name: 'gradient_loading.png',
      src: gradientLoading,
      width: 20,
    },
  ])(
    '$name matches the dimensions its component declares',
    function ({ height, src, width }) {
      expect(intrinsicSize(src)).toEqual({ height, width })
    },
  )
})
