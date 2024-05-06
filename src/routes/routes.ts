import { Router } from "express";
import Mails from '../controllers/mails';
import licenseRoutes from './licensesRoutes';
import orderRoutes from './ordersRoutes';

const router = Router();

router.use('/license', licenseRoutes);
router.use('/orders', orderRoutes);
router.use('/salesOrders', orderRoutes);
router.use('/salesCheck', orderRoutes);
router.post('/mail', Mails.sendMail);

export default router;