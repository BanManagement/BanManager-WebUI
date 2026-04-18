const fs = require('fs').promises
const { Command } = require('@oclif/core')
const chalk = require('chalk')
const helpers = require('../../utils/proxy')

const detectApache = async () => {
  const candidates = [
    { confDir: '/etc/apache2', sitesAvailable: '/etc/apache2/sites-available', enableCmd: 'a2ensite', reloadCmd: 'systemctl reload apache2', logDir: '/var/log/apache2', flavour: 'debian' },
    { confDir: '/etc/httpd', sitesAvailable: '/etc/httpd/conf.d', enableCmd: null, reloadCmd: 'systemctl reload httpd', logDir: '/var/log/httpd', flavour: 'rhel' }
  ]

  for (const candidate of candidates) {
    try {
      await fs.access(candidate.confDir)
      return candidate
    } catch (_) {}
  }

  return null
}

class ApacheCommand extends Command {
  async run () {
    this.log('Setting up Apache configuration...')

    const apache = await detectApache()

    if (!apache) {
      this.log(chalk.yellow('Apache does not appear to be installed (neither /etc/apache2 nor /etc/httpd were found)'))
      this.log('Install Apache (e.g. `sudo apt install apache2` or `sudo dnf install httpd`) and re-run.')
      return
    }

    const answers = await helpers.promptDomainAndSubdirectory()

    if (await helpers.ensureBasePathSaved(answers)) {
      return this.error(chalk.red('Please re-run `npm run build` and restart the WebUI to apply the new BASE_PATH environment variable before continuing'))
    }

    const subdirectory = answers.subdirectory || '/'
    const subdirectoryMatch = subdirectory === '/' ? '/(.*)' : `${subdirectory.replace(/\/$/, '')}/(.*)`

    const apacheConfig = await helpers.renderTemplate({
      templateName: 'apache.conf.template',
      dir: __dirname,
      vars: {
        domain: answers.domain,
        subdirectory,
        subdirectoryMatch,
        logDir: apache.logDir
      }
    })

    const targetPath = `${apache.sitesAvailable}/${answers.domain}.conf`
    const tempPath = `/tmp/${answers.domain}.conf`

    if (!(await helpers.promptOverwrite(targetPath, 'Apache configuration'))) {
      return this.error('Apache setup aborted by user')
    }

    await fs.writeFile(tempPath, apacheConfig)

    this.log('')
    this.log('Apache configuration:')
    this.log(chalk.dim(apacheConfig))

    const commands = [
      `sudo mv ${tempPath} ${targetPath}`,
      'sudo a2enmod proxy proxy_http proxy_wstunnel rewrite headers || true',
      ...(apache.enableCmd ? [`sudo ${apache.enableCmd} ${answers.domain}`] : []),
      `sudo ${apache.reloadCmd}`
    ]

    try {
      await helpers.runCommands(commands, { logger: this })
    } catch (e) {
      this.log(chalk.yellow(`Apache reload step reported: ${e.message}`))
      this.log(chalk.yellow(`Verify the config with: sudo apachectl configtest && sudo ${apache.reloadCmd}`))
    }

    this.log(chalk.green(`Apache configuration written to ${targetPath}`))
    this.log('')
    this.log(chalk.cyan('Next steps for HTTPS (strongly recommended for production):'))
    this.log(chalk.cyan(`  1. Point DNS for ${answers.domain} at this server.`))
    this.log(chalk.cyan(`  2. Install certbot if needed: sudo ${apache.flavour === 'rhel' ? 'dnf install certbot python3-certbot-apache' : 'apt install certbot python3-certbot-apache'}`))
    this.log(chalk.cyan(`  3. Run: sudo certbot --apache -d ${answers.domain}`))
    this.log(chalk.dim('     (certbot will rewrite the file you just generated to add HTTPS + a HTTP→HTTPS redirect)'))
    this.log(chalk.dim(`     If you already have a certificate, uncomment the HTTPS block in ${targetPath} and reload Apache.`))

    await helpers.probeProxy({
      domain: answers.domain,
      subdirectory: answers.subdirectory || '',
      protocol: 'http',
      logger: this
    })
  }
}

ApacheCommand.description = 'Generate an Apache reverse-proxy site (HTTP) for the WebUI'

module.exports = ApacheCommand
