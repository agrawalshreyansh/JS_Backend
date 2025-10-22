import { ApiError } from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

export const verifyJWT = asyncHandler(async(req,_,next) => {

try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
       

        if (!token) {
            throw new ApiError(401,"Unauthorized request - No token provided")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        
        if (!decodedToken) {
            throw new ApiError(401, "Invalid token")
        }
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user;

        next()

} catch (error) {

    // Check if the error is due to token expiration
    if (error.name === 'TokenExpiredError') {
        return next(new ApiError(403, "Access token has expired"))
    }
    
    // For other JWT errors (invalid signature, malformed, etc.)
    if (error.name === 'JsonWebTokenError') {
        return next(new ApiError(401, "Invalid access token"))
    }

    return next(new ApiError(401, error.message || "Unauthorized"))
}

})