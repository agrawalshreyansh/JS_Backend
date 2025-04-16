import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { uploadOnCloud } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";

import mongoose from "mongoose";
import { ObjectId } from 'mongodb';


const uploadVideo = asyncHandler(async(req,res) => {
    const {title, description, owner} = req.body 

    const owner_id = req.user._id

    if ( 
        [title, description, owner].some((field) => field?.trim() === "")
    ){
        throw new ApiError(400,"All fields are required!")
    }

    if (req.files) {
            throw new ApiError(401,"Files are required!")
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
        throw new ApiError(401, "Video upload failed")
    }

    if (!thumbnail) {
        throw new ApiError(401, "Thumbnail upload failed")
    }

    const addVideo = await Video.create({
        videoFile : video.secure_url,
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
    const id = req.params.id

    if (!id?.trim) {
        throw new ApiError(400,"Video is missing")
    }

    await Video.updateOne({ _id: id }, { 
        $inc: { views: 1 } 
    });

    if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid Video ID format");
    }

    // const video = await Video.aggregate([
    //     { $match: { _id: new ObjectId(id.toString()) } }, 
    //     {
    //         $addFields: {
    //             likeCount: { $size: { $ifNull: ["$likes", []] } },  
    //             dislikeCount: { $size: { $ifNull: ["$dislikes", []] } } 
    //         }
    //     },
    //     { 
    //         $project: { 
    //             videoFile:1,
    //             thumbnail:1,
    //             title :1,
    //             description :1,
    //             duration :1,
    //             views :1,
    //             isPublished :1,
    //             owner :1,
    //             likeCount:1,
    //             dislikeCount:1
    //         } 
    //     }
    // ]);

    const video = await Video.aggregate([
        { $match: { _id: new ObjectId(id.toString()) } },
        {
          $addFields: {
            likeCount: { $size: { $ifNull: ["$likes", []] } },
            dislikeCount: { $size: { $ifNull: ["$dislikes", []] } }
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails"
          }
        },
        { $unwind: "$ownerDetails" },
        {
          $lookup: {
            from: "subscriptions",
            localField: "ownerDetails._id",
            foreignField: "channel",
            as: "subs"
          } 
        },
        {
            $addFields: {
              subscriberIds: {
                $map: {
                  input: "$subs",
                  as: "sub",
                  in: "$$sub.subscriber"
                }
              }
            }
          },
        {
          $addFields: {
            subscribers: { $size: "$subs" },
            isSubscribed: {
                $in: [new ObjectId(req.user?._id), "$subscriberIds"]
              }
          }
          
        },
        {
          $project: {
            videoFile: 1,
            thumbnail: 1,
            title: 1,
            description: 1,
            duration: 1,
            views: 1,
            isPublished: 1,
            likeCount: 1,
            dislikeCount: 1,
            owner: "$ownerDetails.username",
            owner_image : "$ownerDetails.avatar",
            subscribers: 1,
            isSubscribed: 1,
            subs:1
          }
        }
      ]);
      
      
    
    if (!video) {
        throw new ApiError(400,"This video doesn't exist!")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,video[0],"Video found"))
})

const watchHistory = asyncHandler(async(req,res) => {
    const owner_id = req.user._id
    
    if (!owner_id) {
        throw new ApiError(401, "User Unauthorized")
    }


    const history = await User.findById(owner_id).select("watchHistory")

    

    if (!history) {
        throw new ApiError(400, "Couldn't find User History")
    }

    const historyVideos = await User.aggregate([
        {
            $match : {_id : owner_id},
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                pipeline: [
                    {
                        $lookup: {
                            from: "users", 
                            localField: "owner", 
                            foreignField: "_id", 
                            as: "owner"
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            views: 1,
                            createdAt: 1,
                            duration: 1,
                            owner: { $arrayElemAt: ["$owner", 0] } 
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            thumbnail: 1,
                            title: 1,
                            description: 1,
                            views: 1,
                            createdAt: 1,
                            duration: 1,
                            "owner._id": 1,
                            "owner.username": 1,
                            "owner.avatar": 1
                        }
                    }
                ],
                as: "historyVideo"
            }
        },
        {
        $project: { _id:0 , historyVideo:1 } 
        }
    ])

    

    return res
    .status(200)
    .json(new ApiResponse(200,historyVideos.length > 0 ? historyVideos[0].historyVideo : [],"Watch History Fetched"))
})


const channelVideos = asyncHandler(async(req,res) => {
    const username = req.params.username

    if (!username) {
        throw new ApiError(400,"Channel Doesn't Exist")
    }

    const owner_id = await User.find({username : username}).select("_id")

    if (!owner_id) {
        throw new ApiError(401,"Invalid username")
    }

    const userVideos = await Video.find({owner:owner_id}).select("thumbnail title views _id")

    if (!userVideos) {
        throw new ApiError(401,'Videos fetch failed')
    }

    res
    .status(200)
    .json(new ApiResponse(200,userVideos,"Videos fetched"))
})

const updateWatchHistory = asyncHandler(async(req,res) => {
    const videoId = req.params.id
    const _id = req.user._id

    if (!_id) {
        throw new ApiError(400, "User not logged in !")
    }

    const userHistory = await User.findById(_id).select('watchHistory')

    if (userHistory.watchHistory[0]?.toString() !== videoId.toString()) {
        await User.findByIdAndUpdate(_id,
            { $push: { watchHistory: { $each: [videoId], $position: 0 } } }, {new:true})
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Watch History Updated"))


})

const increaseLike = asyncHandler(async(req,res) => {
    const videoId = req.params.id
    const _id = req.user._id

    if (!_id) {
        throw new ApiError(400, "User not logged in !")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(401,'Video not found')
    }

    const hasLiked = video.likes.includes(_id);
    const hasDisliked = video.dislikes.includes(_id);

        if (hasLiked) {
            video.likes.pull(_id);
        } else {
            video.likes.push(_id);
            if (hasDisliked) {
                video.dislikes.pull(_id)
            }
        }
        await video.save();

    return res 
    .status(200)
    .json(new ApiResponse(200,{},'Like Added'))
})

const increaseDislike = asyncHandler(async(req,res) => {
    const videoId = req.params.id
    const _id = req.user._id

    if (!_id) {
        throw new ApiError(400, "User not logged in !")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(401,'Video not found')
    }

    const hasDisliked = video.dislikes.includes(_id);
    const hasLiked = video.likes.includes(_id);


        if (hasDisliked) {
            video.dislikes.pull(_id);
            
        } else {
            video.dislikes.push(_id);
            if (hasLiked) {
                video.likes.pull(_id)
            }
        }
        await video.save();

    return res 
    .status(200)
    .json(new ApiResponse(200,{},'Like Added'))
})


export {
    playVideo,
    uploadVideo,
    watchHistory,
    channelVideos,
    updateWatchHistory,
    increaseLike,
    increaseDislike
}