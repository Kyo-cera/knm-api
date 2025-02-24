import { Request, Response } from 'express';
import customerService from "../services/customerService";
import { sendError, sendSuccess } from '../utils/requestHandlers';
import { writeToLog } from "../utils/writeLog";
class customerController{

    //
    async getCustomerAllPdfProcess(req: Request, res: Response){
        try{
            const readPdf = await customerService.getCustomerAllPdfProcess();
            sendSuccess(res, readPdf);
        }catch(error: any){
            sendError(res, error.message);
        }
    }
    async getCustomerPdfProcess(req: Request, res: Response){
        try{
            const readPdf = await customerService.getCustomerPdfProcess();
            sendSuccess(res, readPdf);
        }catch(error: any){
            sendError(res, error.message);
        }
    }
    async getCustomerPdfRead(req: Request, res: Response){
        try{
            const readPdf = await customerService.getCustomerPdfRead();
            sendSuccess(res, readPdf);
        }catch(error: any){
            sendError(res, error.message);
        }
    }
    //
    async getCustomerPdfUpdate(req: Request, res: Response){
        try{
            const updatePdf = await customerService.getCustomerPdfUpdate();
            sendSuccess(res, updatePdf);
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async getAllCustomers(req: Request, res: Response){
        try{
            const customer = await customerService.getAllCustomers();
            sendSuccess(res, customer);
        }catch(error: any){
            sendError(res, error.message);
        }
    }
    async getCustomerByItem(req: Request, res: Response){
        try{
            const id = Number(req.params['id']);
            const customer = await customerService.getCustomerByItemOda(id);
            if(customer){
                sendSuccess(res, customer);
            }else{
                sendError(res, `ODa not found`, 404);
            }
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async postCustomer(req: Request, res: Response){
        try{
            const data = req.body;
            const customer = await customerService.postCustomer(data); 
            if(customer){
                sendSuccess(res, customer);
            }else{
                sendError(res, `Customer not created`, 500);
            }
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async getCheckCustomer(req: Request, res: Response){
        try{
            const response = await customerService.getCheckCustomer();
            sendSuccess(res, response);
        }catch(error: any){
            sendError(res, error.message);
        }
    }
    //getCustomerPdfList
    async getCustomerPdfList(req: Request, res: Response){
        try{
            const response = await customerService.getCustomerPdfList();
            sendSuccess(res, response);
        }catch(error: any){
            sendError(res, error.message);
        }
    }


}
export default new customerController();