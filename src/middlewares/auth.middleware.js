import { ApiError } from "../utils/ApiError.js"
import jwt from "jsonwebtoken"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

export const verifyJWT = asyncHandler(async(req,_,next) => {

try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
       

        if (!token) {
            throw new ApiError(401,"Unauthorized request")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        
        if (!decodedToken) {
            throw new ApiError(500, "Token expired")
        }
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if (!user) {
            throw new ApiError(402, "Invalid Access Token")
        }
    
        req.user = user;

        next()

} catch (error) {

    return next(new ApiError(401, error.message || "Unauthorized"))
}

})