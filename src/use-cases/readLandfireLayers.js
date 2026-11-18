import { LandfireReader } from "#lib"
function makeTifPath(map) { return `c:/Landfire/downloads/${map}/${map}.tif` }
const file = 'AOI_47_114_5'
const tifPath = makeTifPath(file)
const reader = new LandfireReader()

const t0 = performance.now()
await reader.load(tifPath)
const t1 = performance.now()
console.log(`Msec to load(tifPath): ${Math.round(t1-t0)}`)

// Read all cell raw values
const t2 = performance.now()
const cells = reader.rows * reader.cols
for (let i=0; i<cells; i++) {
    // eslint-disable-next-line no-unused-vars
    const raw = reader.getRaw(i)
}
const t3 = performance.now()
console.log(`Msec to getRaw() all cells: ${Math.round(t3-t2)}`)

// Read all cell converted values
const t4 = performance.now()
for (let i=0; i<cells; i++) {
    // eslint-disable-next-line no-unused-vars
    const converted = reader.getConverted(i)
}
const t5 = performance.now()
console.log(`Msec to getConverted() all cells: ${Math.round(t5-t4)}`)

let idx = Math.trunc(reader.cols * reader.rows/2 + reader.cols/2)    // a central cell
console.log(`Raw Values at ${idx}`, reader.getRaw(idx))
console.log(`Converted Values at ${idx}`, reader.getConverted(idx))
const t6 = performance.now()
console.log('Total elapsed time', Math.round(t6-t0), 'msec')