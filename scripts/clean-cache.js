const fs = require('fs')
const path = require('path')

function rm(p) {
  try {
    const target = path.resolve(p)
    if (fs.existsSync(target)) {
      fs.rmSync(target, { recursive: true, force: true })
      console.log('removed', target)
    } else {
      console.log('not found', target)
    }
  } catch (e) {
    console.error('failed to remove', p, e)
  }
}

rm('dist')
rm('.vite')
rm('node_modules/.vite')
console.log('clean-cache done')
