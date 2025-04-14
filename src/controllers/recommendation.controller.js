import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { Video } from "../models/video.model.js";


const HomeVideos = asyncHandler(async (req,res) => {

    const videos = await Video.aggregate([
        { $sample: { size: 20 } },
        {
          $lookup: {
            from: 'users',
            localField: 'owner',
            foreignField: '_id',
            as: 'owner'
          }
        },
        { $unwind: '$owner' },
        {
          $project: {
            title: 1,
            thumbnail: 1,
            views: 1,
            createdAt: 1,
            owner: {
              _id: 1,
              username: 1,
              avatar: 1
            }
          }
        }
      ]);
      

    if (!videos) {
        throw new ApiError(500,"Couldn't fetch Videos")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,videos,"Videos fetched"))


})

export {HomeVideos}