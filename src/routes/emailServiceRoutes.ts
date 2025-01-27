import { Router } from "express";
import emailServiceController from '../controllers/emailServiceController';

const emailServiceRoutes = Router();

emailServiceRoutes.get('/getEmails', emailServiceController.getEmails);
emailServiceRoutes.get('/downloadAttachments/:messageId', emailServiceController.downloadAttachments);
emailServiceRoutes.get('/checkAndDownload', emailServiceController.checkAndDownload);
emailServiceRoutes.get('/getScheduleData', emailServiceController.getScheduleData);
emailServiceRoutes.post('/scheduleCheckAndDownload', emailServiceController.scheduleCheckAndDownload);

export default emailServiceRoutes;