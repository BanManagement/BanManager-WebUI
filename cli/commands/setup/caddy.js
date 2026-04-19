const fs = require('fs').promises
const { Command } = require('@oclif/core')
const chalk = require('chalk')
const helpers = require('../../utils/proxy')

const CADDY_CONFIG_DIR = '/etc/caddy'

class CaddyCommand extends Command {
  async run () {
    this.log('Setting up Caddy configuration...')

    try {
      await fs.access(CADDY_CONFIG_DIR)
    } catch (e) {
      this.log(chalk.yellow(`Caddy does not appear to be installed (${CADDY_CONFIG_DIR} not found)`))
      this.log('Install Caddy: https://caddyserver.com/docs/install')
      return
    }

    const answers = await helpers.promptDomainAndSubdirectory()

    if (await helpers.ensureBasePathSaved(answers)) {
      return this.error(chalk.red('Please re-run `npm run build` and restart the WebUI to apply the new BASE_PATH environment variable before continuing'))
    }

    const subdirectory = answers.subdirectory || '/'
    const subdirectoryMatch = subdirectory === '/' ? '/*' : `${subdirectory.replace(/\/$/, '')}/*`

    const caddyConfig = await helpers.renderTemplate({
      templateName: 'Caddyfile.template',
      dir: __dirname,
      vars: { domain: answers.domain, subdirectory, subdirectoryMatch }
    })

    const targetPath = `${CADDY_CONFIG_DIR}/Caddyfile.d/${answers.domain}.caddy`
    const targetDir = `${CADDY_CONFIG_DIR}/Caddyfile.d`
    const tempPath = `/tmp/${answers.domain}.caddy`

    if (!(await helpers.promptOverwrite(targetPath, 'Caddy snippet'))) {
      return this.error('Caddy setup aborted by user')
    }

    await fs.writeFile(tempPath, caddyConfig)

    this.log('')
    this.log('Caddy snippet:')
    this.log(chalk.dim(caddyConfig))

    const commands = [
      `sudo mkdir -p ${targetDir}`,
      `sudo mv ${tempPath} ${targetPath}`,
      'sudo caddy validate --config /etc/caddy/Caddyfile || sudo caddy fmt --overwrite /etc/caddy/Caddyfile',
      'sudo systemctl reload caddy || sudo caddy reload --config /etc/caddy/Caddyfile'
    ]

    try {
      await helpers.runCommands(commands, { logger: this })
    } catch (e) {
      this.log(chalk.yellow(`Caddy reload step reported: ${e.message}`))
      this.log(chalk.yellow('Verify your /etc/caddy/Caddyfile imports the snippet (e.g. `import Caddyfile.d/*.caddy`).'))
    }

    this.log(chalk.green(`Caddy snippet written to ${targetPath}`))
    this.log(chalk.green('If your main Caddyfile does not yet import this folder, add the line:'))
    this.log(chalk.yellow('  import Caddyfile.d/*.caddy'))

    await helpers.probeProxy({
      domain: answers.domain,
      subdirectory: answers.subdirectory || '',
      protocol: 'https',
      logger: this
    })
  }
}

CaddyCommand.description = 'Generate a Caddy reverse-proxy snippet (with automatic HTTPS) for the WebUI'

module.exports = CaddyCommand
