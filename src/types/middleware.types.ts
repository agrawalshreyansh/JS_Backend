import { Request } from "express";

export interface AuthenticatedRequest extends Request {
    user?: any; // Replace with UserType if available. Using any to keep it generic unless User is strongly typed.
    token?: string;
}

export interface PaginationQuery {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortType?: 'asc' | 'desc';
}

export interface FileUploadRequest extends Request {
    files?: {
        avatar?: Express.Multer.File[];
        coverImage?: Express.Multer.File[];
        videoFile?: Express.Multer.File[];
        thumbnail?: Express.Multer.File[];
    };
    file?: Express.Multer.File;
}
