import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { uploadOnCloud } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";


const uploadVideo = asyncHandler(async(req,res) => {
    const {title, description, owner} = req.body 

    const owner_id = req.user._id

    if ( 
        [title, description, owner].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required!")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnailFile[0]?.path

    if (!videoLocalPath) {
        throw new ApiError(401, "Video file is required!")
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(401, "Thumbnail is required!")
    }
    
    const thumbnail = await uploadOnCloud(thumbnailLocalPath)
    const video = await uploadOnCloud(videoLocalPath)


    if (!video) {
        throw new ApiError(401, "Video file is required!")
    }
    if (!thumbnail) {
        throw new ApiError(401, "Thumbnail is required!")
    }

    const addVideo = await Video.create({
        videoFile : video.url,
        thumbnail : thumbnail.url,
        title,
        description,
        owner:owner_id,
        duration: video.duration,
    })

    const uploadedVideo = await Video.findById(addVideo._id).select()
     
    return res
    .status(200)
    .json(new ApiResponse(200,uploadedVideo,"Video Upload Successfull!"))

})




const playVideo = asyncHandler(async(req, res) => {
    const {id} = req.params

    if (!id?.trim) {
        throw new ApiError(400,"Video is missing")
    }

    const video = await Video.findById(id).select(
        "-isPublished "
    )

    if (!video) {
        throw new ApiError(400,"This video doesn't exist!")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,video,"Video found"))
})








export {
    playVideo,
    uploadVideo
}