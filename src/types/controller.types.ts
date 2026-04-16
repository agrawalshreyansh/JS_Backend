import { Request, Response } from "express";

export interface IApiResponse<T = any> {
    statusCode: number;
    data: T;
    message: string;
    success: boolean;
}

export interface IApiError {
    statusCode: number;
    message: string;
    errors: any[];
    success: boolean;
    stack?: string;
}

// User related types
export interface IUserChannelProfile {
    _id: string;
    username: string;
    fullName: string;
    avatar: string;
    coverImage: string;
    subscribersCount: number;
    channelsSubscribedToCount: number;
    isSubscribed: boolean;
}

// Video related types
export interface IVideo {
    _id: string;
    videoFile: string;
    thumbnail: string;
    title: string;
    description: string;
    duration: number;
    views: number;
    isPublished: boolean;
    owner: string;
    createdAt: string;
    updatedAt: string;
}

// Subscription related types
export interface ISubscription {
    _id: string;
    subscriber: string;
    channel: string;
    createdAt: string;
    updatedAt: string;
}
