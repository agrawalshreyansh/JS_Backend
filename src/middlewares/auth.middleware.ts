import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types/middleware.types.js";
import { ApiError } from "../utils/ApiError.js";
import jwt from "jsonwebtoken";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

interface JwtPayload {
    _id: string;
}

export class AuthMiddleware {
    private static instance: AuthMiddleware;

    private constructor() {}

    public static getInstance(): AuthMiddleware {
        if (!AuthMiddleware.instance) {
            AuthMiddleware.instance = new AuthMiddleware();
        }
        return AuthMiddleware.instance;
    }

    public verifyJWT = asyncHandler(async (req: AuthenticatedRequest, _: Response, next: NextFunction) => {
        try {
            const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
        
            if (!token) {
                throw new ApiError(401, "Unauthorized request - No token provided");
            }

            const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET as string) as JwtPayload;
            
            if (!decodedToken) {
                throw new ApiError(401, "Invalid token");
            }
        
            const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
        
            if (!user) {
                throw new ApiError(401, "Invalid Access Token");
            }
        
            req.user = user;
            next();

        } catch (error: any) {
            if (error.name === 'TokenExpiredError') {
                return next(new ApiError(403, "Access token has expired"));
            }
            if (error.name === 'JsonWebTokenError') {
                return next(new ApiError(401, "Invalid access token"));
            }
            return next(new ApiError(401, error.message || "Unauthorized"));
        }
    });
}

export const authMiddleware = AuthMiddleware.getInstance();
export const verifyJWT = authMiddleware.verifyJWT;
