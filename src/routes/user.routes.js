import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser, getUserChannelProfile,changeCurrentPassword, authenticateUser, deleteHistory } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {verifyJWTOptionally} from "../middlewares/optionalAuth.middleware.js"

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount: 1
        },
        {
            name:"coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)


router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/user/:username").get(verifyJWTOptionally,getUserChannelProfile)
router.route('/changepassword').get(changeCurrentPassword)
router.route('/authenticateStatus').get(verifyJWT,authenticateUser)
router.route('/deletehistory').post(verifyJWT,deleteHistory)

export default router