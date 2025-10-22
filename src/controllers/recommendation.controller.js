import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import { Video } from "../models/video.model.js";


const HomeVideos = asyncHandler(async (req,res) => {

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    const videos = await Video.aggregate([
        { $sort: { createdAt: -1 } },
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
            duration: 1,
            category: 1,
            owner: {
              _id: 1,
              username: 1,
              avatar: 1
            }
          }
        },
        { $skip: skip },
        { $limit: limit }
      ]);
      
    const totalVideos = await Video.countDocuments();

    if (!videos) {
        throw new ApiError(500,"Couldn't fetch Videos")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {
        videos,
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(totalVideos / limit),
            totalVideos,
            videosPerPage: limit,
            hasNextPage: page < Math.ceil(totalVideos / limit),
            hasPrevPage: page > 1
        }
    }, "Videos fetched"))


})

const searchVideos = asyncHandler(async (req, res) => {
    const { query } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const skip = (page - 1) * limit;

    if (!query || query.trim() === '') {
        throw new ApiError(400, "Search query is required");
    }

    const searchQuery = {
        $or: [
            { title: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } }
        ]
    };

    const videos = await Video.aggregate([
        { $match: searchQuery },
        { $sort: { createdAt: -1 } },
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
                duration: 1,
                category: 1,
                description: 1,
                owner: {
                    _id: 1,
                    username: 1,
                    avatar: 1
                }
            }
        },
        { $skip: skip },
        { $limit: limit }
    ]);

    const totalVideos = await Video.countDocuments(searchQuery);

    return res
        .status(200)
        .json(new ApiResponse(200, {
            videos,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalVideos / limit),
                totalVideos,
                videosPerPage: limit,
                hasNextPage: page < Math.ceil(totalVideos / limit),
                hasPrevPage: page > 1
            },
            searchQuery: query
        }, "Videos fetched successfully"));
});

export {HomeVideos, searchVideos}