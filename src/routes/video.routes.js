import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {playVideo, uploadVideo} from "../controllers/video.controller.js"


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

export default router