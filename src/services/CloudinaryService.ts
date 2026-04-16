import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import fs from 'fs';

class CloudinaryService {
    private static instance: CloudinaryService;

    private constructor() {
        cloudinary.config({ 
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
            api_key: process.env.CLOUDINARY_API_KEY, 
            api_secret: process.env.CLOUDINARY_API_SECRET 
        });
    }

    public static getInstance(): CloudinaryService {
        if (!CloudinaryService.instance) {
            CloudinaryService.instance = new CloudinaryService();
        }
        return CloudinaryService.instance;
    }

    public async uploadOnCloud(localFilePath: string): Promise<UploadApiResponse | null> {
        try {
            if (!localFilePath) return null;

            const response = await cloudinary.uploader.upload(localFilePath, {
                resource_type: 'auto'
            });

            fs.unlinkSync(localFilePath);
            return response;
        } catch (error) {
            if (fs.existsSync(localFilePath)) {
                fs.unlinkSync(localFilePath);
            }
            return null;
        }
    }
}

export const cloudinaryService = CloudinaryService.getInstance();
