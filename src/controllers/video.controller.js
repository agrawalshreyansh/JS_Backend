import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Video } from "../models/video.model.js";
import { cloudinaryService } from "../services/CloudinaryService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { ObjectId } from 'mongodb';


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    const pipeline = [];

    // Filter by query (title or description)
    if (query) {
        pipeline.push({
            $match: {
                $or: [
                    { title: { $regex: query, $options: "i" } },
                    { description: { $regex: query, $options: "i" } }
                ]
            }
        });
    }

    // Filter by userId
    if (userId) {
        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        });
    }

    // Sort
    if (sortBy && sortType) {
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : -1
            }
        });
    } else {
        pipeline.push({
            $sort: {
                createdAt: -1
            }
        });
    }

    // Lookup owner details
    pipeline.push({
        $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
            pipeline: [
                {
                    $project: {
                        username: 1,
                        fullName: 1,
                        avatar: 1
                    }
                }
            ]
        }
    }, {
        $unwind: "$owner"
    });

    const videoAggregate = Video.aggregate(pipeline);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const videos = await Video.aggregatePaginate(videoAggregate, options);

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "Videos fetched successfully"));
});

const createVideo = asyncHandler(async (req, res) => {
    const { title, description, playlist, category } = req.body;
    const owner_id = req.user._id;

    if ([title, description, playlist, category].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required!");
    }

    if (!req.files || !req.files.videoFile || !req.files.thumbnailFile) {
        throw new ApiError(400, "Video and thumbnail files are required!");
    }

    const thumbnail = await cloudinaryService.uploadOnCloud(thumbnailLocalPath)
    const video = await cloudinaryService.uploadOnCloud(videoLocalPath)

    if (!videoFile) {
        throw new ApiError(400, "Video upload failed");
    }

    if (!thumbnail) {
        throw new ApiError(400, "Thumbnail upload failed");
    }

    const video = await Video.create({
        videoFile: videoFile.url || videoFile.secure_url,
        thumbnail: thumbnail.url,
        title,
        description,
        playlist,
        category,
        owner: owner_id,
        duration: videoFile.duration,
    });

    return res
        .status(201)
        .json(new ApiResponse(201, video, "Video uploaded successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid or missing Video ID");
    }

    const video = await Video.aggregate([
        { $match: { _id: new mongoose.Types.ObjectId(id) } },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "ownerDetails",
                pipeline: [
                    {
                        $lookup: {
                            from: "subscriptions",
                            localField: "_id",
                            foreignField: "channel",
                            as: "subscribers"
                        }
                    },
                    {
                        $addFields: {
                            subscribersCount: { $size: "$subscribers" },
                            isSubscribed: {
                                $cond: {
                                    if: { $in: [req.user?._id, "$subscribers.subscriber"] },
                                    then: true,
                                    else: false
                                }
                            }
                        }
                    },
                    {
                        $project: {
                            username: 1,
                            avatar: 1,
                            subscribersCount: 1,
                            isSubscribed: 1
                        }
                    }
                ]
            }
        },
        { $unwind: "$ownerDetails" },
        {
            $addFields: {
                likesCount: { $size: { $ifNull: ["$likes", []] } },
                dislikesCount: { $size: { $ifNull: ["$dislikes", []] } },
                isLiked: {
                    $cond: {
                        if: { $in: [req.user?._id, { $ifNull: ["$likes", []] }] },
                        then: true,
                        else: false
                    }
                }
            }
        }
    ]);

    if (!video || video.length === 0) {
        throw new ApiError(404, "Video not found");
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video[0], "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    const thumbnailLocalPath = req.file?.path;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    if (!title && !description && !thumbnailLocalPath) {
        throw new ApiError(400, "At least one field is required for update");
    }

    const video = await Video.findById(id);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Authorization check
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to update this video");
    }

    const updateFields = {};
    if (title) updateFields.title = title;
    if (description) updateFields.description = description;

    if (thumbnailLocalPath) {
        // Delete old thumbnail from Cloudinary if possible
        const oldThumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0];
        await deleteFromCloud(oldThumbnailPublicId, "image");

        const newThumbnail = await uploadOnCloud(thumbnailLocalPath);
        if (!newThumbnail) throw new ApiError(400, "Error while uploading new thumbnail");
        updateFields.thumbnail = newThumbnail.url;
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        id,
        { $set: updateFields },
        { new: true }
    );

    return res
        .status(200)
        .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(400, "Invalid Video ID");
    }

    const video = await Video.findById(id);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // Authorization check
    if (video.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You are not authorized to delete this video");
    }

    // Delete files from Cloudinary
    const videoPublicId = video.videoFile.split("/").pop().split(".")[0];
    const thumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0];

    await deleteFromCloud(videoPublicId, "video");
    await deleteFromCloud(thumbnailPublicId, "image");

    await Video.findByIdAndDelete(id);

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Video deleted successfully"));
});

const getUserVideos = asyncHandler(async (req, res) => {
    const { username } = req.params;

    if (!username) {
        throw new ApiError(400, "Username is required");
    }

    const user = await User.findOne({ username });

    if (!user) {
        throw new ApiError(404, "User not found");
    }

    const videos = await Video.find({ owner: user._id }).sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "User videos fetched successfully"));
});

const watchHistory = asyncHandler(async (req, res) => {
    const owner_id = req.user._id;

    if (!owner_id) {
        throw new ApiError(401, "User Unauthorized");
    }

    const historyVideos = await User.aggregate([
        { $match: { _id: owner_id } },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "historyVideo",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    { $unwind: "$owner" }
                ]
            }
        },
        { $project: { _id: 0, historyVideo: 1 } }
    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, historyVideos.length > 0 ? historyVideos[0].historyVideo : [], "Watch History Fetched"));
});

const updateWatchHistory = asyncHandler(async (req, res) => {
    const videoId = req.params.id;
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(400, "User not logged in !");
    }

    await Video.findByIdAndUpdate(videoId, { $inc: { views: 1 } });

    await User.findByIdAndUpdate(userId, {
        $push: {
            watchHistory: {
                $each: [videoId],
                $position: 0
            }
        }
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Watch History Updated"));
});

const increaseLike = asyncHandler(async (req, res) => {
    const videoId = req.params.id;
    const userId = req.user._id;

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    const hasLiked = video.likes.includes(userId);
    const hasDisliked = video.dislikes.includes(userId);

    if (hasLiked) {
        video.likes.pull(userId);
    } else {
        video.likes.push(userId);
        if (hasDisliked) video.dislikes.pull(userId);
    }
    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, { likeCount: video.likes.length }, "Like Toggled"));
});

const increaseDislike = asyncHandler(async (req, res) => {
    const videoId = req.params.id;
    const userId = req.user._id;

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");

    const hasDisliked = video.dislikes.includes(userId);
    const hasLiked = video.likes.includes(userId);

    if (hasDisliked) {
        video.dislikes.pull(userId);
    } else {
        video.dislikes.push(userId);
        if (hasLiked) video.likes.pull(userId);
    }
    await video.save();

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Dislike Toggled"));
});

export {
    getAllVideos,
    createVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    getUserVideos,
    watchHistory,
    updateWatchHistory,
    increaseLike,
    increaseDislike
};