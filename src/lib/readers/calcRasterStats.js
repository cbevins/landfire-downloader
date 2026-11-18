export function calcRasterStats(data, noData=-9999) {
    // Get min-max
    let validCount = 0
    let count = 0
    let runs = 0
    let maxValue = Number.MIN_SAFE_INTEGER
    let minValue = Number.MAX_SAFE_INTEGER
    let prev = data[0]
    for (let value of data) {
        count++
        // Data runs
        if (value !== prev) {
            runs++
            prev = value
        }
        // Skip typical NoData values if applicable 
        if (value === noData) continue
        validCount++
        if (value < minValue) minValue = value
        if (value > maxValue) maxValue = value
    }
    // get frequency
    return {count, validCount, minValue, maxValue, runs}
}
