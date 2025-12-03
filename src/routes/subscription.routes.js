import {Router} from 'express' ;
import { createSubscriber, subscribedChannelList,subscribedChannelVideos } from '../controllers/subscription.controller.js'
import {verifyJWT} from "../middlewares/auth.middleware.js"


const router = Router()

router.route('/subscribeTo/:id').put(verifyJWT,createSubscriber)
router.route('/mysubscriptions').get(verifyJWT,subscribedChannelList)
router.route('/subscribedvideos').get(verifyJWT,subscribedChannelVideos)


export default router