import { Router } from 'express';
import { createSubscriber, subscribedChannelList, subscribedChannelVideos } from '../controllers/subscription.controller.js';
import { verifyJWT } from "../middlewares/auth.middleware.js";

const subscriptionRouter = Router();

subscriptionRouter.route('/subscribeTo/:id').put(verifyJWT, createSubscriber);
subscriptionRouter.route('/mysubscriptions').get(verifyJWT, subscribedChannelList);
subscriptionRouter.route('/subscribedvideos').get(verifyJWT, subscribedChannelVideos);

export default subscriptionRouter;
