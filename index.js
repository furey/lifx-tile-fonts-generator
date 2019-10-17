require('dotenv').config()
const path = require('path')
const chalk = require('chalk')
const fs = require('fs-extra')
const isEqual = require('lodash.isequal')
const fonts = require('./fonts')
const { createCanvas, registerFont } = require('canvas')

const inspect = value =>
  require('util').inspect(value, false, null, true)

const w = 8, h = 8

const chars =
  `ABCDEFGHIJKLMNO` +
  `PQRSTUVWXYZ0123` +
  `456789[]()<>!?@` +
  `#$%&'"*+-=^~•:;` +
  `.,|/\\`

const toReplace = `_‘’“”`

const rgbaKeys = ['r', 'g', 'b', 'a']

const white = { r: 255, g: 255, b: 255, a: 255 }

const run = async () => {
  await validateInputPath()
  await clearOutput()
  for (let i = 0; i < fonts.length; i++) {
    const group = fonts[i]
    await processGroup(group)
  }
  outputBaseModule(fonts)
}

const validateInputPath = async () => {
  const inputPath = getInputPath()
  if (!(await fs.pathExists(inputPath))) validationError(`Input path [${inputPath}] does not exist.`)
  if (!(await fs.stat(inputPath)).isDirectory()) validationError(`Input path [${inputPath}] is not a directory.`)
}

const validationError = message =>
  exit(message)

const clearOutput = async () =>
  await fs.remove(getOutputPath())

const processGroup = async group => {
  if (process.env.TRIM_FONTS) await trimFonts(group)
  for (let i = 0; i < group.fonts.length; i++) {
    const font = group.fonts[i]
    await processFont(group, font)
  }
  await outputGroupModule(group)
}

const trimFonts = async group => {
  const whitelist = group.fonts.map(font => getFontPath(group, font))
  const groupPath = getInputPath(group.path)
  const groupFiles = await fs.readdir(groupPath)
  for (let i = 0; i < groupFiles.length; i++) {
    const groupFile = groupFiles[i]
    const filePath = path.resolve(groupPath, groupFiles[i])
    const ext = path.extname(groupFile)
    if (ext !== '.ttf') continue
    if (whitelist.includes(filePath)) continue
    await trimGroupFont(groupFile, filePath)
  }
}

const trimGroupFont = async (groupFile, filePath) => {
  console.log(chalk.red(`Trimming → ${groupFile}`))
  console.log(chalk.gray(filePath))
  await fs.remove(filePath)
}

const processFont = async (group, font) => {
  const fontPath = getFontPath(group, font)
  registerFont(fontPath, { family: font.name })
  for (let i = 0; i < chars.length; i++) {
    await processChar({ group, font, charIndex: i })
  }
  await outputFontFile(group, font)
  await outputFontImage(group, font)
  await outputFontModule(group, font)
}

const getFontPath = (group, font) =>
  getInputPath(group.path, font.path)

const processChar = async ({ group, font, charIndex }) => {
  const x = 0, y = 8, size = '8px'
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'white';
  ctx.font = `${size} "${font.name}"`
  const char = chars[charIndex]
  ctx.fillText(char, x, y)
  const { data } = ctx.getImageData(0, 0, w, h)
  const colors = getColors(data)
  const bounds = getBounds(colors)
  previewChar(group, font, char, colors, bounds)
  const outputImagePath = getOutputImagePath(group.name, font.name, `chars/${charIndex}.png`)
  await fs.outputFile(outputImagePath, canvas.toBuffer())
  const outputModulePath = getOutputModulePath(group.name, font.name, `chars/${charIndex}.js`)
  await fs.outputFile(outputModulePath, getCharModule(char, colors, bounds))
}

const getColors = data =>
  Object.values(data.reduce((colors, value, index) => {
    const pixelIndex = Math.floor(index / 4)
    const rgbaIndex = index % 4
    if (!colors[pixelIndex]) colors[pixelIndex] = { r: 0, g: 0, b: 0, a: 0 }
    colors[pixelIndex][rgbaKeys[rgbaIndex]] = value
    return colors
  }, {})).map(rgba => isEqual(rgba, white) ? 'X' : ' ')

const getBounds = colors => {
  let left, right, top, bottom
  left:
  for (let c = 0; c < 8; c++) {
    for (let r = 0; r < 8; r++) {
      const pixel = colors[r * 8 + c]
      if (pixel === ' ') continue
      left = c
      break left
    }
  }
  right:
  for (let c = 8 - 1; c >= 0; c--) {
    for (let r = 0; r < 8; r++) {
      const pixel = colors[r * 8 + c]
      if (pixel === ' ') continue
      right = c
      break right
    }
  }
  top:
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const pixel = colors[r * 8 + c]
      if (pixel === ' ') continue
      top = r
      break top
    }
  }
  bottom:
  for (let r = 8 - 1; r >= 0; r--) {
    for (let c = 0; c < 8; c++) {
      const pixel = colors[r * 8 + c]
      if (pixel === ' ') continue
      bottom = r
      break bottom
    }
  }
  const width = right - (left - 1)
  const height = bottom - (top - 1)
  return { left, right, top, bottom, width, height }
}

const previewChar = (group, font, char, colors, bounds) => {
  console.log(`\n`)
  console.log(chalk.yellow('Group:'), group.name)
  console.log(chalk.yellow('Font:'), font.name)
  console.log(chalk.yellow('Char:'), char)
  console.log(chalk.yellow('Bounds:'), bounds)
  for (let i = 0; i < colors.length; i += 8) {
    const row = colors.slice(i, i + 8)
    console.log(row.map(_ =>
      _ === 'X' ? chalk.white('█') : chalk.gray('·')
    ).join(''))
  }
}

const getCharModule = (char, colors, bounds) => {
  let js = 'module.exports = {\n'
  js += tab() + `char: \`${encodeChar(char)}\`,\n`
  js += tab() + 'bounds: {\n'
  const kv = Object.entries(bounds)
  for (let i = 0; i < kv.length; i++) {
    const [key, value] = kv[i];
    js += tab(2) + `${key}: ${value},\n`
  }
  js += tab() + '},\n'
  js += tab() + 'colors: [\n'
  for (let i = 0; i < colors.length; i += 8) {
    const row = colors.slice(i, i + 8)
    js += tab(2) + row.map(_ => `'${_}',`).join('') + '\n'
  }
  js += tab() + ']\n'
  js += '}'
  return js
}

const encodeChar = char => {
  if (char === '\\') return '\\\\'
  return char
}

const outputFontFile = async (group, font) => 
  await fs.outputFile(getOutputFontFilePath(group, font), getFontPath(group, font))

const outputFontImage = async (group, font) => {
  const x = 0, y = 8, size = '8px'
  const w = 15 * 8
  const h = Math.ceil(chars.length / 15) * 8
  const canvas = createCanvas(w, h)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = 'black'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = 'white';
  ctx.font = `${size} "${font.name}"`
  for (let i = 0; i < chars.length; i++) {
    const char = chars[i]
    ctx.fillText(char, ((i * 8) % w) + x, (Math.floor(i / 15) * 8) + y)
  }
  const outputImagePath = getOutputImagePath(group.name, font.name, `preview.png`)
  await fs.outputFile(outputImagePath, canvas.toBuffer())
}

const outputFontModule = async (group, font) =>
  await fs.outputFile(getOutputFontModulePath(group, font), getFontModule(group, font))

const getFontModule = (group, font) => {
  let js = 'module.exports = {\n'
  js += tab() + `name: '${font.name}',\n`
  js += tab() + `path: '${getFontFilePath(group, font)}',\n`
  js += tab() + 'chars: {\n'
  for (let i = 0; i < chars.length; i++) {
    js += tab(2) + `'${i}': require('./chars/${i}.js'),\n`
  }
  js += tab() + '}\n'
  js += '}\n'
  return js
}

const getFontFilePath = (group, font) =>
  getOutputFontFilePath(group, font)
    .replace(RegExp(`^${getOutputPath()}\/`), '')

const outputGroupModule = async group =>
  await fs.outputFile(getOutputModulePath(group.name, 'index.js'), getGroupModule(group))

const getGroupModule = group => {
  let js = 'module.exports = {\n'
  js += tab() + `name: '${group.name}',\n`
  js += tab() + `source: '${group.source}',\n`
  js += tab() + 'fonts: {\n'
  for (let i = 0; i < group.fonts.length; i++) {
    const font = group.fonts[i]
    js += tab(2) + `'${font.name}': require('./${font.name}/index.js'),\n`
  }
  js += tab() + '}\n'
  js += '}\n'
  return js
}

const outputBaseModule = async fonts => 
  await fs.outputFile(getOutputModulePath('index.js'), getBaseModule(fonts))

const getBaseModule = fonts => {
  let js = 'module.exports = {\n'
  js += tab() + `chars: \`${chars}\`,\n`
  js += tab() + 'groups: {\n'
  for (let i = 0; i < fonts.length; i++) {
    const group = fonts[i]
    js += tab(2) + `'${group.name}': require('./${group.name}/index.js'),\n`
  }
  js += tab() + '}\n'
  js += '}\n'
  return js
}

const getOutputFontFilePath = (group, font) =>
  getOutputFilePath(group.name, `${font.name}.ttf`)

const getOutputFontModulePath = (group, font) =>
  getOutputModulePath(group.name, font.name, 'index.js')

const getOutputFilePath = (...params) =>
  getOutputPath('ttf', ...params)

const getOutputImagePath = (...params) =>
  getOutputPath('png', ...params)

const getOutputModulePath = (...params) =>
  getOutputPath('js', ...params)

const getOutputPath = (...params) =>
  path.resolve(process.env.OUTPUT_PATH || './fonts/output', ...params)

const getInputPath = (...params) =>
  path.resolve(process.env.INPUT_PATH || './fonts/input', ...params)

const exit = async message => {
  if (message) console.log(chalk.red(message))
  console.log(chalk.gray('Exiting…'))
  process.exit()
}

const tab = (total = 1) =>
  '  '.repeat(total)

run().catch(console.error)
