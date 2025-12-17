import { Router } from 'express';
import crypto from 'crypto';
import { asyncHandler } from '../utils/asyncHandler';
import { generateReport } from '../services/reportService';
import { config } from '../config';
import { ApiError } from '../middleware/errorHandler';

export const reportRouter = Router();

reportRouter.post(
  '/v1/report',
  asyncHandler(async (req, res) => {
    if (config.SIGNING_SECRET) {
      const signature = req.headers['x-iphey-signature'];
      if (!signature || typeof signature !== 'string') {
        throw new ApiError(401, 'Missing X-IPHEY-SIGNATURE header');
      }
      const computed = crypto
        .createHmac('sha256', config.SIGNING_SECRET)
        .update(JSON.stringify(req.body))
        .digest('hex');
      if (computed !== signature) {
        throw new ApiError(401, 'Invalid signature');
      }
    }

    const report = await generateReport(req.body, req.ip);
    res.json({ ...report, requestId: res.locals.requestId });
  })
);
