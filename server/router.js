import { Router } from 'express';
import chatRouter from './routes/chat.routes.js';
import predictRouter from './routes/predict.routes.js';
import routeRouter from './routes/route.routes.js';
import translateRouter from './routes/translate.routes.js';

const router = Router();

router.use('/', chatRouter);
router.use('/', predictRouter);
router.use('/', routeRouter);
router.use('/', translateRouter);

export default router;
