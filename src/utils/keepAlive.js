import cron from "node-cron";

const startKeepAliveJob = (serverUrl) => {
    // Schedule a cron job to run every 20 minutes
    // Pattern: '*/20 * * * *' means every 20 minutes
    const job = cron.schedule('*/20 * * * *', async () => {
        try {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] Keep-alive ping initiated...`);
            
            const response = await fetch(`${serverUrl}/api/v1/health`);
            const data = await response.json();
            
            if (response.ok) {
                console.log(`[${timestamp}] ✓ Server is awake - Status: ${data.data.status}`);
            } else {
                console.log(`[${timestamp}] ✗ Server responded with status: ${response.status}`);
            }
        } catch (error) {
            const timestamp = new Date().toISOString();
            console.error(`[${timestamp}] ✗ Keep-alive ping failed:`, error.message);
        }
    });

    console.log('🕐 Keep-alive cron job started - Server will be pinged every 20 minutes');
    
    return job;
};

export { startKeepAliveJob };
