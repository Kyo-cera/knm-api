import { Router } from "express";
import Mails from '../controllers/mails';
import customersRoutes from './customersRoutes';
import licenseRoutes from './licensesRoutes';
import orderRoutes from './ordersRoutes';
import emailRoutes from './emailRoutes';
import scheduleRoutes from "./scheduleRoutes";
import userRoutes from "./usersRoutes";
import devModeRoutes from "./devModeRoutes";
import emailServiceRoutes from "./emailServiceRoutes";

const router = Router();

router.use('/license', licenseRoutes);
router.use('/orders', orderRoutes);
router.use('/salesOrders', orderRoutes);
router.use('/salesCheck', orderRoutes);
router.use('/customer', customersRoutes);
router.use('/email', emailRoutes);
router.use('/schedule', scheduleRoutes);
router.use('/user', userRoutes);
router.use('/emailMC', emailServiceRoutes);
router.use('/devMode', devModeRoutes);
router.post('/mail', Mails.sendMail);

export default router;