import { asyncHandler } from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {Subscription} from '../models/subsciption.model.js'
import {User} from '../models/user.model.js'
import {Video} from '../models/video.model.js'



const createSubscriber = asyncHandler(async (req,res) => {

    const channelName = req.params.id
    const userId = req.user._id

    const channel = await User.findOne({username:channelName})

    const channelId = channel._id

    if (!channelId) {
        throw new ApiError(401,"Channel Doesn't Exist!")
    }

    console.log(channelId,userId)

    if (!channelId) {
        throw new ApiError(401,"Channel Id not recieved!")
    }

    if (!User.findById(channelId)) {
        throw new ApiError(401,"Channel Doesn't Exist!")
    }

    if (userId.equals(channelId)) {
        throw new ApiError(402,"You cannot subscribe to you own Channel")
    }

    console.log(userId === channelId)

    const existingSubscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    });
    
    if (existingSubscription) {
        const unsubscribed = await Subscription.findOneAndDelete({ subscriber: userId, channel: channelId });

        if (!unsubscribed) {
            throw new ApiError(401,"Couldn't unsubscribe!")
        }

        return res
        .status(200)
        .json(new ApiResponse(200,{},"You've unsubscribed successfully"))
        
    } else {
        const subscribed = await Subscription.create({
            subscriber: userId,
            channel: channelId
        });
        if (!subscribed) {
            throw new ApiError(401,"Couldn't subscribe!")
        }
       return res
        .status(200)
        .json(new ApiResponse(200,{},"You've subscribed successfully"))
        
    }

})

const subscribedChannelList = asyncHandler(async(req,res) => {
    const _id = req.user._id

    const channels = await User.aggregate([
        {
            $match: { _id: _id }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $unwind: "$subscribedTo"
        },
        {
            $lookup: {
                from: "users", 
                localField: "subscribedTo.channel",
                foreignField: "_id",
                as: "channelDetails"
            }
        },
        {
            $unwind: "$channelDetails"
        },
        {
            $group: {
                _id: null, 
                subscribedTo: { 
                    $push: { 
                        _id: "$channelDetails._id",
                        username: "$channelDetails.username",
                        avatar: "$channelDetails.avatar"
                    } 
                }
            }
        },
        {
            $project: { _id: 0, subscribedTo: 1 } 
        }
    ]);
    
    
    return res
    .status(200)
    .json(new ApiResponse(200,channels[0],"Channels Fetched Successfully !"))
})

const subscribedChannelVideos = asyncHandler(async(req,res) => {
    const _id = req.user._id

    const videos = await Subscription.aggregate([
        { $match: { subscriber: _id } },
        {
          $lookup: {
            from: "videos",
            localField: "channel",
            foreignField: "owner",
            as: "subscribedToVideos"
          }
        },
        { $unwind: "$subscribedToVideos" },
        {
          $lookup: {
            from: "users",
            localField: "subscribedToVideos.owner",
            foreignField: "_id",
            as: "owner"
          }
        },
        { $unwind: "$owner" },
        {
          $addFields: {
            "subscribedToVideos.owner": {
              _id: "$owner._id",
              username: "$owner.username",
              avatar: "$owner.avatar"
            }
          }
        },
        { $replaceRoot: { newRoot: "$subscribedToVideos" } }
      ]);
      
      
      return res
      .status(200)
      .json(new ApiResponse(200,videos,"Videos fetched"))

})



export {createSubscriber, subscribedChannelList, subscribedChannelVideos}