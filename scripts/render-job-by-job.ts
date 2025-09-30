import path from 'path'
import { __devRenderSample } from '@/reports/JobByJobReport'

async function main() {
  const out = path.join(process.cwd(), 'out', 'job-by-job-sample.pdf')
  await __devRenderSample(out)
  console.log('Wrote', out)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

