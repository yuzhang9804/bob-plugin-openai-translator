import { Configuration } from '@rspack/cli'
import { resolve } from 'node:path'
import { Compiler, CopyRspackPlugin } from '@rspack/core'
import { createWriteStream, unlinkSync, existsSync } from 'node:fs'
import archiver from 'archiver'
import packageJson from './package.json'
import { sources } from '@rspack/core'

const config: Configuration = {
  mode: 'production',
  context: __dirname,
  entry: {
    main: './src/main.ts',
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
  output: {
    path: resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
    iife: false,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: [/node_modules/],
        loader: 'builtin:swc-loader',
        options: {
          jsc: {
            parser: {
              syntax: 'typescript',
            },
          },
        },
        type: 'javascript/auto',
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [
      {
        apply(compiler: Compiler) {
          compiler.hooks.compilation.tap('PreserveVariableNames', (compilation) => {
            compilation.hooks.processAssets.tap(
              {
                name: 'PreserveVariableNames',
                stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_SIZE,
              },
              (assets) => {
                const mainAsset = assets['main.js']
                if (mainAsset) {
                  let source = mainAsset.source().toString()

                  // 保留原始变量名
                  source = source.replace(/\blang_langs\b/g, 'langs')
                  source = source.replace(/\blang_langMap\b/g, 'langMap')

                  // 保留导出函数名
                  source = source.replace(/\bfunction (\w+)\b/g, (match, name) => {
                    if (name === 'translate' || name === 'supportLanguages') {
                      return `function ${name}`
                    }
                    return match
                  })

                  assets['main.js'] = new sources.RawSource(source)
                }
              }
            )
          })
        },
      },
    ],
  },
  plugins: [
    new CopyRspackPlugin({
      patterns: [{ from: 'public', to: '.' }],
    }),
    {
      apply(compiler: Compiler) {
        compiler.hooks.afterEmit.tapAsync('ZipPlugin', (_compilation, callback) => {
          const bobPluginPath = resolve(__dirname, `${packageJson.name}.bobplugin`)

          if (existsSync(bobPluginPath)) {
            try {
              unlinkSync(bobPluginPath)
            } catch (err) {
              console.error(err)
            }
          }

          const output = createWriteStream(bobPluginPath)
          const archive = archiver('zip', { zlib: { level: 9 } })

          output.on('close', () => {
            callback()
          })

          archive.on('error', (err: Error) => {
            throw err
          })

          archive.pipe(output)
          archive.directory(resolve(__dirname, 'dist'), false)
          archive.finalize()
        })
      },
    },
  ],
}

export default config
