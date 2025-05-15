import { ApiError } from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"

export const verifyJWTOptionally = asyncHandler(async(req,_,next) => {

try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        
        if (!token) {
            return next()
        }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        // console.log(decodedToken)
        if (!decodedToken) {
            throw new ApiError(500, "Token expired")
        }
    
        const user = decodedToken
    
        if (!user) {
            throw new ApiError(402, "Invalid Access Token")
        }
    
        req.user = user;
        return next()

} catch (error) {
    return next(new ApiError(401, error.message || "Unauthorized"))
}

})