import connectDB from "./db/index.js";
import  dotenv from "dotenv";
import {app} from './app.js'
import { startKeepAliveJob } from "./utils/keepAlive.js";

dotenv.config({
    path: './.env'
})


connectDB()
.then(() => {
    app.listen(process.env.PORT,"0.0.0.0", () => {
        console.log(`Server is running on http://localhost:${process.env.PORT}`);
        
        // Start the keep-alive cron job
        const serverUrl = process.env.SERVER_URL || `http://localhost:${process.env.PORT}`;
        startKeepAliveJob(serverUrl);
      });
})
.catch((error) => {
    console.error("Database connection failed:", error.message);
    
  })


