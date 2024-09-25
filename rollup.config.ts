import { defineConfig } from 'rollup'
import copy from 'rollup-plugin-copy'
import typescript from '@rollup/plugin-typescript'
import { exec } from 'child_process'
import fs from 'fs'

const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))
const name = packageJson.name

export default defineConfig({
  input: 'src/main.ts',
  output: {
    file: 'dist/main.js',
    format: 'cjs',
  },
  cache: true,
  plugins: [
    copy({
      targets: [
        { src: 'public/icon.png', dest: 'dist' },
        { src: 'public/info.json', dest: 'dist' },
      ],
    }),
    typescript(),
    {
      name: 'build-bob-plugin',
      writeBundle() {
        exec(`rm -f ${name}.bobplugin && cd dist && zip -r ../${name}.zip ./*`, (error) => {
          if (error) {
            console.error('打包失败:', error)
            return
          }
          fs.renameSync(`${name}.zip`, `${name}.bobplugin`)
          console.log('打包完成并重命名为 .bobplugin')
        })
      },
    },
  ],
})
