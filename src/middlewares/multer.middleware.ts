import multer from "multer";
import { Request } from "express";

class FileUploadMiddleware {
    private static instance: FileUploadMiddleware;
    private storage: multer.StorageEngine;
    public upload: multer.Multer;

    private constructor() {
        this.storage = multer.diskStorage({
            destination: function(req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
                cb(null, "./public/temp");
            },
            filename: function(req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
                cb(null, file.originalname);
            }
        });
        
        this.upload = multer({ storage: this.storage });
    }

    public static getInstance(): FileUploadMiddleware {
        if (!FileUploadMiddleware.instance) {
            FileUploadMiddleware.instance = new FileUploadMiddleware();
        }
        return FileUploadMiddleware.instance;
    }
}

export const fileUploadMiddleware = FileUploadMiddleware.getInstance();
export const upload = fileUploadMiddleware.upload;
