import { Router } from "express";
import { HomeVideos, searchVideos } from "../controllers/recommendation.controller.js";

const recommendationRouter = Router();

recommendationRouter.route("/home").get(HomeVideos);
recommendationRouter.route("/search").get(searchVideos);

export default recommendationRouter;
