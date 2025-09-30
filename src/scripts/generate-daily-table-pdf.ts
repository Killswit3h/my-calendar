import fs from 'fs'
import path from 'path'
import { renderDailyTablePDF, type DailyReport } from '../reports/DailyTablePDF'

async function main() {
  const sample: DailyReport = {
    date: '2025-09-29',
    rows: [
      { projectCompany: 'LTS: ALLIGATOR ALCATRAZ', invoice: '12092-O', crewMembers: ['Adrian Ramos','Ventura Hernandez','Ramiro Valle'], work: 'F', payroll: false, payment: 'Daily', vendor: 'Tony', time: 'Day' },
      { projectCompany: 'HALLEY ENGINEERING CONTRACTORS , INC: E8T44', invoice: '', crewMembers: ['—'], work: 'F', payroll: false, payment: 'Sub-Contract', vendor: 'Jorge', time: 'Day' },
      { projectCompany: 'PRINCE CONTRACTING:E8T81', invoice: '11367-Z', crewMembers: ['Robert Gomez','Joselin Aguila','Pedro Manes','Carlos Manuel Diaz'], work: 'G', payroll: false, payment: 'Daily', vendor: 'Jorge', time: 'Day' },
      { projectCompany: 'PRINCE CONTRACTING:E8T81', invoice: '11367-Z', crewMembers: ['Troy Sturgil','John Robinson','Daniel Burnette','Nick Sieber'], work: 'G', payroll: false, payment: 'Daily', vendor: 'Chris', time: 'Day' },
      { projectCompany: 'H & R PAVING, INC.: T6580', invoice: '11966-A', crewMembers: ['Robert Amparo Lloret','Esteban Sanchez','w/ truck'], work: 'F', payroll: true, payment: 'Daily', vendor: 'Jorge', time: 'Day' },
    ],
  }

  const outPath = path.join(process.cwd(), 'out', 'daily-table-sample.pdf')
  const buf = await renderDailyTablePDF(sample)
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, buf)
  console.log('Wrote', outPath)
}

main().catch((e) => { console.error(e); process.exit(1) })
