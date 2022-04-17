// Based on https://github.com/Nurutomo/text2image
const { toPoints, toPath } = require('svg-points')
const { boundingBox, offset } = require('points')

const generateText = async function (font, text, x, y, size, options) {
  text = text.toString()

  const ascender = font.ascender / font.unitsPerEm * size
  const descender = font.descender / font.unitsPerEm * size
  const fontHeight = font.ascender - font.descender
  const defaultOptions = {
    attr: '',
    lineHeight: fontHeight / font.unitsPerEm * size,
    align: 'left',
    padding: 0,
    prepend: '',
    append: '',
    color: 'black'
  }

  options = { ...defaultOptions, ...options }
  options.align = options.align.toLowerCase()

  if (options.padding > 0) {
    x += options.padding
    y += options.padding
  }

  const points = []
  const paths = []
  let maxWidth = 0
  let maxHeight = 0
  const lines = text.includes('\n') ? text.split('\n') : [text]

  for (const i in lines) {
    points.push({
      point: toPoints({
        type: 'path',
        d: font.getPath(lines[i], 0, 0, size).toPathData()
      }),
      width: font.getAdvanceWidth(lines[i], size)
    })

    maxWidth = Math.max(maxWidth, font.getAdvanceWidth(lines[i], size))
  }

  if (options.padding > 0) {
    maxWidth += options.padding * 2
  }

  let yMin = Infinity

  for (const i in points) {
    let { point, width } = points[i]
    const left = 0
    let xAlign
    let yAlign = ascender - descender + y

    yAlign += options.lineHeight * i

    if (options.align === 'center') {
      xAlign = (maxWidth - width) / 2 + x - left
    } else if (options.align === 'left' || options.align === 'start') {
      xAlign = x - left
    } else if (options.align === 'right' || options.align === 'end') {
      xAlign = (maxWidth - width) + x - left
    }

    point = offset(point, xAlign, yAlign)
    yMin = Math.min(yMin, boundingBox(point).top)
    paths.push(`<path fill="${options.color}" d="${toPath(point)}"${options.attr ? ' ' + options.attr : ''}/>`)
    maxHeight = Math.max(maxHeight, boundingBox(point).bottom + options.padding * 2)
  }

  const svg = `<svg width="${maxWidth}" height="${maxHeight}" xmlns="http://www.w3.org/2000/svg">\n ${options.prepend.split('\n').join('\n ')}\n ${paths.join('\n ')}\n ${options.append.split('\n').join('\n ')}\n</svg>`

  return {
    maxWidth,
    maxHeight,
    buffer: Buffer.from(svg, 'utf-8')
  }
}

module.exports = {
  generateText
}
