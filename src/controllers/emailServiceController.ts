import { Request, Response } from 'express';
import emailService from "../services/emailService";
import { sendError, sendSuccess } from '../utils/requestHandlers';
import { ScheduleData } from "models/scheduleData";

class emailServiceController{

    async getEmails(req: Request, res: Response){
        try{
            const email = await emailService.getEmails();
            sendSuccess(res, email);
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async downloadAttachments(req: Request, res: Response){
        try{
            const messageId = String(req.params['messageId']);
            const email = await emailService.downloadAttachments(messageId);
            sendSuccess(res, email);
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async checkAndDownload(req: Request, res: Response){
        try{
            const attachments = await emailService.checkAndDownload();
            sendSuccess(res, attachments);
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async scheduleCheckAndDownload(req: Request, res: Response) {
        try {
            const scheduleData: ScheduleData = req.body;
            if (!scheduleData.ora || !scheduleData.minuti) {
                return sendError(res, "I parametri 'ora' e 'minuti' sono obbligatori.", 400);
            }

            emailService.scheduleCheckAndDownload(scheduleData);
            sendSuccess(res, { message: `✅ API programmata per le ${scheduleData.ora}:${scheduleData.minuti}` });
        } catch (error: any) {
            sendError(res, error.message);
        }
    }


}

export default new emailServiceController();
