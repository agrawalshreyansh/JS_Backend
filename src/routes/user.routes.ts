import { Router } from "express";
import { loginUser, logoutUser, refreshAccessToken, registerUser, getUserChannelProfile, changeCurrentPassword, authenticateUser, deleteHistory } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { verifyJWTOptionally } from "../middlewares/optionalAuth.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 }
    ]),
    registerUser
);

userRouter.route("/login").post(loginUser);
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/refresh-token").post(refreshAccessToken);
userRouter.route("/user/:username").get(verifyJWTOptionally, getUserChannelProfile);
userRouter.route('/changepassword').put(changeCurrentPassword);
userRouter.route('/authenticateStatus').get(verifyJWT, authenticateUser);
userRouter.route('/deletehistory').put(verifyJWT, deleteHistory);

export default userRouter;
