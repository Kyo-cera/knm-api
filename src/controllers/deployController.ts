import { Request, Response } from 'express';
import { sendError, sendSuccess } from '../utils/requestHandlers';
import deployService from '../services/deployService';

class deployController{

    async deployBE(req: Request, res: Response){
        try{
            const users = await deployService.deployBE();
            sendSuccess(res, users);
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async deployFE(req: Request, res: Response){
        try{
            const users = await deployService.deployFE();  
            sendSuccess(res, users);
        }catch(error: any){
            sendError(res, error.message);
        }
    }
    async deployBEPROD(req: Request, res: Response){
        try{
            const users = await deployService.deployBEPROD();
            sendSuccess(res, users);
        }catch(error: any){
            sendError(res, error.message);
        }
    }
    async deployFEPROD(req: Request, res: Response){
        try{
            const users = await deployService.deployFEPROD();  
            sendSuccess(res, users);
        }catch(error: any){
            sendError(res, error.message);
        }
    }
}
export default new deployController();