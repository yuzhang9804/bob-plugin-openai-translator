import fs from 'node:fs'
import crypto from 'node:crypto'
import path from 'node:path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const infoPath = path.join(__dirname, '../public/info.json')
const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'))
const oldVersion = info.version

console.log(`Old version is ${oldVersion}`)

function updateAppcast(version, desc) {
  const releaseFile = path.join(__dirname, '../release', `deepseek-translator-${version}.bobplugin`)
  if (!fs.existsSync(releaseFile)) {
    throw new Error('Release file not exist')
  }

  const fileContent = fs.readFileSync(releaseFile)
  const fileHash = crypto.createHash('sha256').update(fileContent).digest('hex')

  const versionInfo = {
    version: version,
    desc: desc,
    sha256: fileHash,
    url: `https://github.com/yuzhang9804/bob-plugin-deepSeek-translator/releases/download/v${version}/${path.basename(releaseFile)}`,
    minBobVersion: '0.5.0',
  }

  const appcastFile = path.join(__dirname, '../appcast.json')
  let appcast

  if (fs.existsSync(appcastFile)) {
    appcast = JSON.parse(fs.readFileSync(appcastFile, 'utf8'))
  } else {
    appcast = { identifier: 'yuzhang.deepseek.translator', versions: [] }
  }

  appcast.versions.unshift(versionInfo)

  fs.writeFileSync(appcastFile, JSON.stringify(appcast, null, 2))
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const version = process.argv[2]
  const desc = process.argv[3]
  updateAppcast(version, desc)
}

export default updateAppcast
