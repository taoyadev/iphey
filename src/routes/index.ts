import { Router } from 'express';
import { healthRouter } from './health';
import { ipRouter } from './ip';
import { reportRouter } from './report';
import { threatsRouter } from './threats';
import { asnRouter } from './asn';

export const apiRouter = Router();

apiRouter.use(healthRouter);
apiRouter.use(ipRouter);
apiRouter.use(reportRouter);
apiRouter.use(threatsRouter);
apiRouter.use(asnRouter);
