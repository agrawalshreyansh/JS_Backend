import { Router } from "express";

import { HomeVideos, searchVideos } from "../controllers/recommendation.controller.js";


const router = Router()

router.route("/home").get(HomeVideos)
router.route("/search").get(searchVideos)


export default router