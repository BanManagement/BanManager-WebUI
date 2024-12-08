const fs = require('fs').promises
const inquirer = require('inquirer')
const { Command } = require('@oclif/core')
const path = require('path')
const fillTemplate = require('es6-dynamic-template')
const fetch = require('node-fetch')
const { exec, spawn } = require('child_process')
const chalk = require('chalk')

class SystemdCommand extends Command {
  async run () {
    this.log('Setting up systemd service...')

    // Confirm systemd exists
    try {
      await fs.access('/etc/systemd')
    } catch (e) {
      this.log('Systemd is not installed on this system')
      return
    }

    // Check if the system is running with systemd as the init system
    exec('ps -p 1 -o comm=', (initError, stdout, stderr) => {
      if (initError || stdout.trim() !== 'systemd') {
        this.log('System has not been booted with systemd as init system (PID 1).')
      } else {
        this.setupService()
      }
    })
  }

  async setupService () {
    // Check if the service already exists
    let serviceExists = false
    try {
      await fs.access('/etc/systemd/system/bmwebui.service')
      serviceExists = true
    } catch (e) {}

    if (serviceExists) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'Service already exists. Do you want to overwrite it?',
          default: false
        }
      ])

      if (!overwrite) {
        return this.error('Service setup aborted by user')
      }
    }

    // Prompt user for necessary information
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'user',
        message: 'Enter the user to run the service (this should not be root or have sudo access):',
        default: process.env.USER
      }
    ])

    // Use process.execPath to get the path for node
    const nodePath = process.execPath

    // Find the path for npm
    const npmPath = await new Promise((resolve, reject) => {
      exec('which npm', (error, stdout) => {
        if (error) return reject(error)
        resolve(stdout.trim())
      })
    })

    // Read and render the template file
    const templatePath = path.join(__dirname, 'bmwebui.service.template')
    const templateContent = await fs.readFile(templatePath, 'utf8')
    const serviceContent = fillTemplate(templateContent, {
      dir: process.cwd(),
      user: answers.user,
      nodePath,
      npmPath
    })

    // Write the service file with sudo
    const tempServicePath = '/tmp/bmwebui.service'
    await fs.writeFile(tempServicePath, serviceContent)

    const commands = [
      `sudo mv ${tempServicePath} /etc/systemd/system/bmwebui.service`,
      'sudo systemctl enable bmwebui.service'
    ]

    this.log(chalk.cyan('The following commands will be run:'))
    commands.forEach(cmd => this.log(chalk.yellow(cmd)))
    this.log(chalk.cyan('We need to use sudo to move the service file to the systemd directory and enable the service. Please enter your password if prompted.'))

    const enableService = spawn('sh', ['-c', commands.join(' && ')])

    enableService.stdout.on('data', (data) => {
      this.log(data.toString())
    })

    enableService.stderr.on('data', (data) => {
      this.error(chalk.red(data.toString()))
    })

    enableService.on('close', (code) => {
      if (code !== 0) {
        this.error(chalk.red(`Error enabling the service: process exited with code ${code}`))
      } else {
        this.log(chalk.green('Service enabled successfully'))

        // Stream the output of the startup process
        const journalctl = spawn('sudo', ['journalctl', '--unit=bmwebui.service', '--since=now', '-f'])

        journalctl.stdout.on('data', (data) => {
          this.log(data.toString())
        })

        journalctl.stderr.on('data', (data) => {
          this.error(chalk.red(data.toString()))
        })

        journalctl.on('error', () => {})

        // Start the service
        const startService = spawn('sudo', ['systemctl', 'start', 'bmwebui.service'])

        startService.stdout.on('data', (data) => {
          this.log(data.toString())
        })

        startService.stderr.on('data', (data) => {
          this.error(chalk.red(data.toString()))
        })

        startService.on('close', async (startCode) => {
          if (startCode !== 0) {
            this.error(chalk.red(`Error starting the service: process exited with code ${startCode}`))
          } else {
            this.log(chalk.green('Service started successfully'))

            // Health check
            const checkService = async (retries = 60) => {
              try {
                const response = await fetch(`http://localhost:${process.env.PORT || 3000}/`)
                if (response.ok) {
                  this.log(chalk.green('Service is running successfully'))
                } else {
                  throw new Error('Service is not running')
                }
              } catch (healthError) {
                if (retries > 0) {
                  setTimeout(() => checkService(retries - 1), 1000)
                } else {
                  this.error(chalk.red(`Service health check failed: ${healthError.message}`))
                }
              }
            }

            await checkService()
          }

          journalctl.stdin.end()
          journalctl.stdout.destroy()
          journalctl.stderr.destroy()
          journalctl.kill('SIGTERM')
        })
      }
    })
  }
}

SystemdCommand.description = 'Setup systemd to run the app as a service'

module.exports = SystemdCommand
