import { Router } from "express";

import { HomeVideos } from "../controllers/recommendation.controller.js";


const router = Router()

router.route("/home").get(HomeVideos)


export default router