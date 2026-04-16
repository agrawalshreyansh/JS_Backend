import cron from "node-cron";

class KeepAliveService {
    private static instance: KeepAliveService;
    private job: cron.ScheduledTask | null = null;

    private constructor() {}

    public static getInstance(): KeepAliveService {
        if (!KeepAliveService.instance) {
            KeepAliveService.instance = new KeepAliveService();
        }
        return KeepAliveService.instance;
    }

    public startKeepAliveJob(serverUrl: string): cron.ScheduledTask {
        if (this.job) {
            console.log('🕐 Keep-alive job is already running');
            return this.job;
        }

        this.job = cron.schedule('*/10 * * * *', async () => {
            try {
                const timestamp = new Date().toISOString();
                console.log(`[${timestamp}] Keep-alive ping initiated...`);
                
                const response = await fetch(`${serverUrl}/api/v1/health`);
                const data = await response.json() as any;
                
                if (response.ok) {
                    console.log(`[${timestamp}] ✓ Server is awake - Status: ${data?.data?.status}`);
                } else {
                    console.log(`[${timestamp}] ✗ Server responded with status: ${response.status}`);
                }
            } catch (error: any) {
                const timestamp = new Date().toISOString();
                console.error(`[${timestamp}] ✗ Keep-alive ping failed:`, error.message);
            }
        });

        console.log('🕐 Keep-alive cron job started - Server will be pinged every 10 minutes');
        return this.job;
    }
}

export const keepAliveService = KeepAliveService.getInstance();
