import fs from 'fs'
import path from 'path'
import fetch from 'node-fetch'

const apiDir = path.join(process.cwd(), 'app/api')

function getApiRoutes(dir = apiDir, prefix = '/api') {
  const files = fs.readdirSync(dir)
  const routes = []

  for (const file of files) {
    const fullPath = path.join(dir, file)
    const stat = fs.statSync(fullPath)

    if (stat.isDirectory()) {
      routes.push(...getApiRoutes(fullPath, `${prefix}/${file}`))
    } else if (file.endsWith('.js') || file.endsWith('.ts')) {
      let route = file.replace(/\.(js|ts)$/, '')
      if (route === 'index') route = ''
      routes.push(`${prefix}/${route}`)
    }
  }

  return routes
}

async function checkRoute(route) {
  const url = `http://localhost:3000${route}`

  try {
    const [res1, res2] = await Promise.all([fetch(url), fetch(url)])
    const text1 = await res1.text()
    const text2 = await res2.text()

    const cached = text1 === text2
    console.log(cached ? `Possibly cached: ${route}` : `Fresh: ${route}`)
  } catch (err) {
    console.error(`Error fetching ${route}:`, err.message)
  }
}

async function main() {
  const routes = getApiRoutes()
  console.log(`Found ${routes.length} API routes\n`)
  for (const route of routes) await checkRoute(route)
}

main()
