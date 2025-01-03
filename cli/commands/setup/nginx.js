const fs = require('fs').promises
const inquirer = require('inquirer')
const { Command } = require('@oclif/core')
const path = require('path')
const fillTemplate = require('es6-dynamic-template')
const fetch = require('node-fetch')
const { spawn } = require('child_process')
const chalk = require('chalk')

class NginxCommand extends Command {
  async run () {
    this.log('Setting up nginx configuration...')

    // Confirm nginx is installed
    try {
      await fs.access('/etc/nginx')
    } catch (e) {
      this.log('Nginx is not installed on this system')
      return
    }

    // Prompt user for necessary information
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'domain',
        message: 'Enter the domain for the application:',
        default: 'example.com'
      },
      {
        type: 'input',
        name: 'subdirectory',
        message: 'Enter the subdirectory for the application (leave blank for root):',
        default: process.env.BASE_PATH || ''
      }
    ])

    if (answers.subdirectory && !answers.subdirectory.startsWith('/')) {
      this.error('Subdirectory must start with a forward slash /')
    }

    if ((answers.subdirectory && !process.env.BASE_PATH) || (answers.subdirectory && process.env.BASE_PATH !== answers.subdirectory)) {
      await fs.writeFile('.env', `\nBASE_PATH=${answers.subdirectory}\n`, { flag: 'a' })

      this.error(chalk.red('Please re-run `npm run build` and restart the WebUI to apply the new BASE_PATH environment variable before continuing'))
    }

    // Read and render the template file
    const templatePath = path.join(__dirname, 'nginx.conf.template')
    const templateContent = await fs.readFile(templatePath, 'utf8')
    const nginxConfig = fillTemplate(templateContent, {
      domain: answers.domain,
      subdirectory: answers.subdirectory || '/',
      port: process.env.PORT || 3000
    })

    // Check if the nginx configuration file already exists
    const nginxConfigPath = `/etc/nginx/sites-available/${answers.domain}`
    let overwrite = true
    try {
      await fs.access(nginxConfigPath)
      const response = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: `Configuration file for ${answers.domain} already exists. Do you want to overwrite it?`,
          default: false
        }
      ])
      overwrite = response.overwrite
    } catch (e) {}
    if (!overwrite) {
      return this.error('Nginx setup aborted by user')
    }

    // Write the nginx configuration file with sudo
    const tempConfigPath = `/tmp/${answers.domain}.conf`
    await fs.writeFile(tempConfigPath, nginxConfig)
    const moveConfigCommand = `sudo mv ${tempConfigPath} ${nginxConfigPath}`
    const createSymlinkCommand = `sudo ln -sf ${nginxConfigPath} /etc/nginx/sites-enabled/${answers.domain}`
    const reloadNginxCommand = 'sudo nginx -s reload'
    const commands = [moveConfigCommand, createSymlinkCommand, reloadNginxCommand]

    this.log(chalk.cyan('The following commands will be run:'))
    commands.forEach(cmd => this.log(chalk.yellow(cmd)))
    this.log(chalk.cyan('We need to use sudo to move the configuration file and create a symlink. Please enter your password if prompted.'))

    const executeCommands = spawn('sh', ['-c', commands.join(' && ')])

    executeCommands.stdout.on('data', (data) => {
      this.log(data.toString())
    })

    executeCommands.stderr.on('data', (data) => {
      const errorMessage = data.toString()

      if (errorMessage.includes('signal process started')) {
        this.log(chalk.green('Nginx reload notice: signal process started'))
      } else {
        this.error(chalk.red(errorMessage))
      }
    })

    executeCommands.on('close', async (code) => {
      if (code !== 0) {
        this.error(chalk.red(`Error setting up nginx: process exited with code ${code}`))
      } else {
        this.log(chalk.green('Nginx setup successfully'))
        await this.testNginxConfig(answers.domain, answers.subdirectory || '')
      }
    })
  }

  async testNginxConfig (domain, basePath) {
    // Send a test request to confirm it's all working
    const checkService = async (retries = 60) => {
      try {
        const response = await fetch(`http://${domain}${basePath}/login`)
        if (response.ok) {
          this.log(chalk.green('Nginx configuration is working successfully'))
        } else {
          throw new Error('Nginx configuration is not working')
        }
      } catch (error) {
        if (retries > 0) {
          setTimeout(() => checkService(retries - 1), 1000)
        } else {
          this.error(chalk.red(`Nginx configuration test failed: ${error.message}`))
        }
      }
    }
    await checkService()
  }
}

NginxCommand.description = 'Setup nginx to run the app as a service'

module.exports = NginxCommand
