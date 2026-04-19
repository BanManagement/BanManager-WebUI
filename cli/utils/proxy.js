const fs = require('fs').promises
const path = require('path')
const inquirer = require('inquirer')
const editDotenv = require('edit-dotenv')
const fillTemplate = require('es6-dynamic-template')
const fetch = require('node-fetch')
const chalk = require('chalk')
const { spawn } = require('child_process')

// Strict validators — these values are interpolated into shell commands, file
// paths and HTTP/Apache/Caddy config templates. Anything outside this set
// could be used for command/path injection.
const DOMAIN_REGEX = /^(?=.{1,253}$)([a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/
const SUBDIRECTORY_REGEX = /^\/[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*$/

const validateDomain = (input) => {
  if (typeof input !== 'string' || !input.length) return 'Domain is required'
  if (!DOMAIN_REGEX.test(input)) {
    return 'Domain must be a valid hostname (letters, digits, dots, hyphens) with no schemes, slashes or shell metacharacters'
  }
  return true
}

const validateSubdirectory = (input) => {
  if (input == null || input === '') return true
  if (typeof input !== 'string') return 'Subdirectory must be a string'
  if (!input.startsWith('/')) return 'Subdirectory must start with a forward slash /'
  if (!SUBDIRECTORY_REGEX.test(input)) {
    return 'Subdirectory may only contain letters, digits, hyphens and underscores between forward slashes (e.g. /admin or /admin/webui)'
  }
  return true
}

const promptDomainAndSubdirectory = async () => {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'domain',
      message: 'Enter the domain for the application:',
      default: 'example.com',
      validate: validateDomain
    },
    {
      type: 'input',
      name: 'subdirectory',
      message: 'Enter the subdirectory for the application (leave blank for root):',
      default: process.env.BASE_PATH || '',
      validate: validateSubdirectory
    }
  ])

  // Belt-and-braces: re-validate post-prompt in case inquirer was bypassed
  // (e.g. via --skip-interactive flags in future or programmatic callers).
  const domainCheck = validateDomain(answers.domain)
  if (domainCheck !== true) throw new Error(domainCheck)

  const subdirCheck = validateSubdirectory(answers.subdirectory)
  if (subdirCheck !== true) throw new Error(subdirCheck)

  return answers
}

const ensureBasePathSaved = async ({ subdirectory }) => {
  if (!subdirectory) return false
  if (process.env.BASE_PATH === subdirectory) return false

  let existing = ''
  try { existing = await fs.readFile('.env', 'utf8') } catch (_) {}
  const next = editDotenv(existing, { BASE_PATH: subdirectory })
  await fs.writeFile('.env', next, 'utf8')
  return true
}

const renderTemplate = async ({ templateName, dir, vars }) => {
  const templatePath = path.join(dir, templateName)
  const templateContent = await fs.readFile(templatePath, 'utf8')

  return fillTemplate(templateContent, {
    ...vars,
    port: process.env.PORT || 3000
  })
}

const promptOverwrite = async (filePath, label) => {
  try {
    await fs.access(filePath)
  } catch (e) {
    return true
  }

  const { overwrite } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'overwrite',
      message: `${label} for ${filePath} already exists. Do you want to overwrite it?`,
      default: false
    }
  ])

  return overwrite
}

const runCommands = (commands, { logger }) => new Promise((resolve, reject) => {
  logger.log(chalk.cyan('The following commands will be run:'))
  commands.forEach(cmd => logger.log(chalk.yellow(cmd)))
  logger.log(chalk.cyan('You may be prompted for your sudo password.'))

  const child = spawn('sh', ['-c', commands.join(' && ')])

  child.stdout.on('data', (data) => logger.log(data.toString()))
  child.stderr.on('data', (data) => {
    const message = data.toString()
    if (/signal process started|nginx -t/i.test(message)) {
      logger.log(chalk.dim(message.trim()))
      return
    }
    logger.log(chalk.yellow(message.trim()))
  })

  child.on('close', code => code === 0 ? resolve() : reject(new Error(`Process exited with code ${code}`)))
})

const probeProxy = async ({ domain, subdirectory = '', protocol = 'http', logger }) => {
  const target = `${protocol}://${domain}${subdirectory}/health`
  const checkService = async (retries = 60) => {
    try {
      const response = await fetch(target)
      if (response.ok) {
        logger.log(chalk.green(`Proxy is forwarding ${target} successfully`))
        return
      }
      throw new Error(`Status ${response.status}`)
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000))
        return checkService(retries - 1)
      }
      logger.log(chalk.yellow(`Could not verify ${target}: ${error.message}`))
      logger.log(chalk.yellow('This can be normal if DNS is still propagating, the WebUI is not yet running, or HTTPS is still being provisioned.'))
    }
  }

  await checkService()
}

module.exports = {
  promptDomainAndSubdirectory,
  ensureBasePathSaved,
  renderTemplate,
  promptOverwrite,
  runCommands,
  probeProxy,
  validateDomain,
  validateSubdirectory
}
