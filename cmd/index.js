const path = require('path')
exports = module.exports = (prog) => {
  prog
    .option('--conf <config-path>', 'config file path default: <CWD>/etc/config.json', path.resolve(process.cwd(), 'etc', 'config.json'))

  process.on('unhandledRejection', function (err) {
    console.error(err)
  })
}
