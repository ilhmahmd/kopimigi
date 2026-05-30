import { cp, rm } from 'node:fs/promises'
import { spawn } from 'node:child_process'

const app = process.env.APP_TARGET || process.env.APP || 'pos'
const allowedApps = new Set(['pos', 'booth'])

if (!allowedApps.has(app)) {
  console.error(`Invalid APP_TARGET "${app}". Use "pos" or "booth".`)
  process.exit(1)
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32' })
    child.on('close', (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${command} ${args.join(' ')} exited with code ${code}`))
    })
  })
}

await run('npm', ['run', `build:${app}`])
await rm('dist', { recursive: true, force: true })
await cp(`apps/${app}/dist`, 'dist', { recursive: true })