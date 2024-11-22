import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/requestHandlers';
import scheduleService from '../services/scheduleService';
class scheduleController{

    async scheduleByType(req: Request, res: Response) {
        try {
            const { type } = req.params;
            const { ora, minuti, settimanale, giornoDellaSettimana, mensile, giornoDelMese } = req.body;
            const validType = type as 'importLicenses' | 'importOrders' | 'importCustomers' | 'sendOrders';


            // Passa i dati al service
            const responseMessage = await scheduleService.scheduleByType(
                validType,
                ora,
                minuti,
                settimanale,
                giornoDellaSettimana,
                mensile,
                giornoDelMese
            );

            sendSuccess(res, responseMessage);
        } catch (error: any) {
            sendError(res, error.message);
        }
    }

    async getScheduleByType(req: Request, res: Response) {
        try {
            const { type } = req.params;
            const validType = type as 'importLicenses' | 'importOrders' | 'importCustomers' | 'sendOrders';
            if (!type) {
                return sendError(res, 'Il parametro "type" è obbligatorio.', 400);
            }

            const scheduleData = await scheduleService.getScheduleByType(validType);
            sendSuccess(res, scheduleData);
        } catch (error: any) {
            sendError(res, error.message);
        }
    }


}
export default new scheduleController();