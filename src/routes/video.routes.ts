import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { playVideo, uploadVideo, watchHistory, channelVideos, updateWatchHistory, increaseLike, increaseDislike } from "../controllers/video.controller.js";
import { verifyJWTOptionally } from "../middlewares/optionalAuth.middleware.js";

const videoRouter = Router();

videoRouter.route("/upload").post(
    verifyJWT,
    upload.fields([
        { name: "videoFile", maxCount: 1 },
        { name: "thumbnailFile", maxCount: 1 }
    ]),
    uploadVideo
);

videoRouter.route("/play/:id").get(verifyJWTOptionally, playVideo);
videoRouter.route("/history").get(verifyJWT, watchHistory);
videoRouter.route("/getVideos/:username").get(channelVideos);
videoRouter.route('/:id/updateHistory').patch(verifyJWT, updateWatchHistory);
videoRouter.route('/:id/like').patch(verifyJWT, increaseLike);
videoRouter.route('/:id/dislike').patch(verifyJWT, increaseDislike);

export default videoRouter;
