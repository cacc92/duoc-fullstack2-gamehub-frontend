// Configuración de Karma con webpack y Babel, como pide el caso para EP2.
// Usa .cjs porque package.json tiene "type": "module".
const path = require('node:path')
const webpack = require('webpack')

// babel.config.cjs instrumenta el código para la cobertura solo cuando BABEL_ENV es "test"
process.env.BABEL_ENV = 'test'

const SRC = path.resolve(__dirname, 'src')

module.exports = function (config) {
  config.set({
    basePath: '',

    // Jasmine aporta describe, it, expect y los espías; webpack arma un paquete con cada prueba
    frameworks: ['jasmine', 'webpack'],

    // Las pruebas viven junto al código: src/**/*.spec.js y src/**/*.spec.jsx
    files: [{ pattern: 'src/**/*.spec.js*', watched: false }],
    preprocessors: { 'src/**/*.spec.js*': ['webpack'] },

    webpack: {
      mode: 'development',
      devtool: 'inline-source-map',
      module: {
        // babel-loader traduce JSX con @babel/preset-react
        rules: [{ test: /\.jsx?$/, exclude: /node_modules/, use: 'babel-loader' }],
      },
      resolve: { extensions: ['.js', '.jsx'] },
      plugins: [
        // src/config.js usa import.meta.env, que es propio de Vite; en las pruebas se reemplaza por un doble
        new webpack.NormalModuleReplacementPlugin(/[\\/]config\.js$/, (recurso) => {
          if (recurso.context.startsWith(SRC)) {
            recurso.request = path.join(SRC, 'pruebas', 'config.prueba.js')
          }
        }),
      ],
    },

    // progress muestra el avance; coverage genera coverage/html y un resumen en la terminal
    reporters: ['progress', 'coverage'],
    coverageReporter: {
      dir: 'coverage/',
      reporters: [
        { type: 'html', subdir: 'html' },
        { type: 'text-summary' },
        // maxCols evita que los nombres largos se corten con «...» cuando la terminal es angosta
        { type: 'text', subdir: '.', file: 'por-archivo.txt', maxCols: 200 },
      ],
      // Umbral: npm test falla si la cobertura baja de lo logrado (111 pruebas, noviembre de 2026).
      // Súbelo cuando agregues pruebas; no lo bajes para que una entrega pase.
      check: {
        global: { statements: 96, branches: 86, functions: 96, lines: 98 },
      },
    },

    // ChromeHeadless corre sin ventana; cambia a 'Chrome' para ver el navegador
    browsers: ['ChromeHeadless'],
    singleRun: true,
    autoWatch: false,

    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    concurrency: 1,
  })
}
