/**
 * Polls the LANDFIRE REST for the status of a job.
 * This text works fine when pasted into a browser:
 * lfps.usgs.gov/api/job/status?JobId=831569a4-4d87-4212-b9ac-0738560f6d64
 */

export async function landfirePollStatus(jobId, msec=5000) {
    const url = `https://lfps.usgs.gov/api/job/status?JobId=${encodeURIComponent(jobId)}`

    console.log(`⏳ Polling LANDFIRE for status of job: ${jobId}`)
    while (true) {
        try {
            const response = await fetch(url)
            if (!response.ok) {
                throw new Error(`❌ HTTP error! Status: ${response.status} ${response.statusText}`);
            }
            const data = await response.json()
            const status = data?.status; // Adjust according to the exact JSON schema returned (e.g., data.Status or data.status)
            
            // Check if status is no longer Pending or Executing
            if (status === 'Pending') {
                console.log(`  [${new Date().toLocaleTimeString()}] ⏳ ${status} at queue position ${data.queuePosition} ...`);
            } else if (status === 'Executing') {
                console.log(`  [${new Date().toLocaleTimeString()}] ⏳ ${status} ...`)
            } else if (status === 'Succeeded') {
                console.log(`  [${new Date().toLocaleTimeString()}] ✅ ${status} !`)
                return data
            } else {    // 'FAILED' or 'CANCELLED'
                console.log(`  [${new Date().toLocaleTimeString()}] ❌ ${status} ...`)
                console.log(data)
            }
        } catch (error) {
            console.error(` ❌ Error polling job status: ${error.message}`)
        }

        // Wait before the next check
        await new Promise((resolve) => setTimeout(resolve, msec))
    }
}
