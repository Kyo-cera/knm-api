import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/requestHandlers';
import emailManagment from '../services/emailManagment';

class devModeController{

    async devMode(req: Request, res: Response){
        try{
            const devMode = await emailManagment.inDevMode();
            sendSuccess(res, devMode);
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async getDevMode(req: Request, res: Response){
        try{
            const devMode = await emailManagment.getDevMode();
            sendSuccess(res, devMode);
        }catch(error: any){
            sendError(res, error.message);
        }
    }

}

export default new devModeController();
