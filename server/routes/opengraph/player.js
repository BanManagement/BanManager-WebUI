const { isUUID } = require('validator')
const { parse } = require('uuid-parse')
const path = require('path')
const sharp = require('sharp')
const send = require('koa-send')
const opentype = require('opentype.js')
const https = require('https')
const { readFileSync } = require('fs')
const { stat } = require('fs/promises')
const { generateText } = require('./utils')
const playerStatistics = require('../../graphql/resolvers/queries/player-statistics')

const publicDir = path.resolve('public')
const normalFont = opentype.loadSync(path.join(publicDir, 'fonts/Inter-Regular.ttf'))
const boldFont = opentype.loadSync(path.join(publicDir, 'fonts/Inter-Bold.ttf'))

const fallbackAvatar = readFileSync(path.join(publicDir, 'images/steve-body-render.png'))

const ttl = 1 * 60 * 60 * 1000 // 1 hour

module.exports = async function (ctx) {
  const { request: { params }, throw: throwError, state, log } = ctx

  if (!isUUID(params.id)) return throwError(400, 'Invalid UUID')

  try {
    const file = await stat(path.join(publicDir, `images/opengraph/cache/player-${params.id}.png`))

    if (file.mtime && (Date.now() - file.mtime.getTime()) < (ttl)) {
      log.debug({ player: params.id }, 'Serving cached player card')

      return send(ctx, `images/opengraph/cache/player-${params.id}.png`, { root: publicDir, maxage: ttl })
    }
  } catch {
  }

  const playerId = parse(params.id, Buffer.alloc(16))
  const player = await state.loaders.player.load({ id: playerId, fields: ['name'] })

  if (!player) return throwError(404, 'Player not found')

  const data = await playerStatistics({}, { player: playerId }, { state })

  const bansTotal = await generateText(normalFont, data.totalBans, 0, 0, 45, { color: '#fff' })
  const mutesTotal = await generateText(normalFont, data.totalMutes, 0, 0, 45, { color: '#fff' })
  const reportsTotal = await generateText(normalFont, data.totalReports, 0, 0, 45, { color: '#fff' })
  const warningsTotal = await generateText(normalFont, data.totalWarnings, 0, 0, 45, { color: '#fff' })
  const playerName = await generateText(boldFont, player.name, 0, 0, 72, { color: '#fff', align: 'center' })

  let avatar

  try {
    avatar = await fetchAvatar(params.id)
  } catch (e) {
    log.warn(e)
    avatar = fallbackAvatar
  }

  const width = 1200

  await sharp('./public/images/opengraph/player-template.png')
    .composite([
      {
        input: playerName.buffer,
        top: 27,
        left: Math.floor((width - Math.floor(playerName.maxWidth)) / 2)
      },
      {
        input: bansTotal.buffer,
        top: 199,
        left: 457,
        gravity: 'northwest'
      },
      {
        input: mutesTotal.buffer,
        top: 380,
        left: 457,
        gravity: 'northwest'
      },
      {
        input: reportsTotal.buffer,
        top: 199,
        left: 797,
        gravity: 'northwest'
      },
      {
        input: warningsTotal.buffer,
        top: 380,
        left: 797,
        gravity: 'northwest'
      },
      {
        input: avatar,
        top: 109,
        left: 60,
        gravity: 'northwest'
      }
    ])
    .toFile(`./public/images/opengraph/cache/player-${params.id}.png`)

  await send(ctx, `images/opengraph/cache/player-${params.id}.png`, { root: publicDir, maxage: ttl })
}

const fetchAvatar = async function (id) {
  return new Promise((resolve, reject) => {
    const req = https.get(`https://crafatar.com/renders/body/${id}?scale=10&overlay=true&w=256`, res => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Status Code: ${res.statusCode}`))
      }

      const data = []

      res.on('data', chunk => {
        data.push(chunk)
      })

      res.on('end', () => resolve(Buffer.concat(data)))
    })

    req.on('error', reject)

    req.end()
  })
}
