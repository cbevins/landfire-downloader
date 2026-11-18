/**
 * Reads a LANDFIRE GeoTIFF file and allows direct access to all 8 layers
 * (either raw or converted into wildland fire simulation values).
 */
import { loadGeoTiffRasters } from "./loadGeoTiffRasters.js"

export class LandfireReader {
    constructor(){
        this.rasters = null
        this.cols = 0
        this.rows = 0
        this.tifPath = ''
        this.tan = [0]
        for(let deg=1; deg<=89; deg++)
            this.tan.push(Math.tan(deg * Math.PI / 180))
    }

    async load(tifPath) {
        this.tifPath = tifPath
        this.rasters = await loadGeoTiffRasters(tifPath)
        this.rows = this.rasters.height
        this.cols = this.rasters.width
    }
    getRaw(idx) {
        return {
            elev: this.rasters[0][idx],
            slopDegrees: this.rasters[1][idx],
            aspect: this.rasters[2][idx],
            fuelKey: this.rasters[3][idx],
            canopyCover: this.rasters[4][idx],
            canopyHeight: this.rasters[5][idx],
            canopyBase: this.rasters[6][idx],
            canopyBulk: this.rasters[7][idx],
        }
    }
    
    getConverted(idx) {
        return {
            elev: this.getElev(idx),
            slopDegrees: this.getSlopeDegrees(idx),
            aspect: this.getAspect(idx),
            fuelKey: this.getFbfm40(idx),
            canopyCover: this.getCanopyCover(idx),
            canopyHeight: this.getCanopyHeight(idx),
            canopyBase: this.getCanopyBase(idx),
            canopyBulk: this.getCanopyBulk(idx)
        }
    }
    getElev(idx) {
        const val = this.rasters[0][idx]
        return (val < 1000) ? 0 : val * 3.2808
    }
    getSlopeDegrees(idx) {
        const val = this.rasters[1][idx] // 1 = 1 deg
        return val < 1 ? 0 : this.tan[val]
    }
    getAspect(idx) {
        const val = this.rasters[2][idx]  // 1 = 1 deg, -1 if no slope
        return val < -1 ? -1 : val
    }
    getFbfm40(idx) {
        const val = this.rasters[3][idx]   // number code
        return val < 0 ? 0 : val
    }
    getCanopyCover(idx) {
        const val = this.rasters[4][idx]    // 1 = 1%
        return val < 0 ? 0 : val / 100      // fraction
    }
    getCanopyHeight(idx) {
        const val = this.rasters[5][idx]        // 1 = 0.1 m
        return val < 0 ? 0 : 3.2808 * val / 10  // ft
    }
    getCanopyBase(idx) {
        const val = this.rasters[6][idx] / 10   // 1 = 0.1 m
        return val < 0 ? 0 : 3.2808 * val / 10  // ft
    }
    getCanopyBulk(idx) {
        const val = this.rasters[7][idx]            // 1 = 0.01 Kg/m3
        return val < 0 ? 0 : 0.062428 * val / 100   // lb/ft3
    }
}
