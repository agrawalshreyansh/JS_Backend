import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/middleware.types.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";

export class OptionalAuthMiddleware {
    private static instance: OptionalAuthMiddleware;

    private constructor() {}

    public static getInstance(): OptionalAuthMiddleware {
        if (!OptionalAuthMiddleware.instance) {
            OptionalAuthMiddleware.instance = new OptionalAuthMiddleware();
        }
        return OptionalAuthMiddleware.instance;
    }

    public verifyJWTOptionally = asyncHandler(async (req: AuthenticatedRequest, _: Response, next: NextFunction) => {
        try {
            const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
            
            if (!token) {
                return next();
            }
        
            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string);
            if (!decodedToken) {
                throw new ApiError(500, "Token expired");
            }
        
            const user = decodedToken;
        
            if (!user) {
                throw new ApiError(402, "Invalid Access Token");
            }
        
            req.user = user;
            return next();

        } catch (error: any) {
            return next(new ApiError(401, error.message || "Unauthorized"));
        }
    });
}

export const optionalAuthMiddleware = OptionalAuthMiddleware.getInstance();
export const verifyJWTOptionally = optionalAuthMiddleware.verifyJWTOptionally;
