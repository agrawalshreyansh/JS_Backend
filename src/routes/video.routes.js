import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {playVideo, uploadVideo, watchHistory, channelVideos, updateWatchHistory} from "../controllers/video.controller.js"


const router = Router()

router.route("/upload").post(
    verifyJWT,
    upload.fields([
        {
            name : "videoFile",
            maxCount : 1
        },
        {
            name : "thumbnailFile" ,
            maxCount : 1
        }
    ]),
    uploadVideo
)

router.route("/play/:id").get(playVideo)
router.route("/history").get(verifyJWT,watchHistory)
router.route("/getVideos/:username").get(channelVideos)
router.route('/:id/updateHistory').get(verifyJWT,updateWatchHistory)

export default router
