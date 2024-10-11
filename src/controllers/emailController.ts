import { Request, Response } from 'express';
import mailService from "../services/mailService";
import { sendError, sendSuccess } from '../utils/requestHandlers';
import { e_mail } from 'models/e-mail';

class emailController{

    async getAllEmail(req: Request, res: Response){
        try{
            const email = await mailService.getAllEmail();
            sendSuccess(res, email);
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async getAllEmailCustomers(req: Request, res: Response){
        try{
            const email = await mailService.getAllEmailCustomers();
            sendSuccess(res, email);
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async getAllEmailAdmin(req: Request, res: Response){
        try{
            const email = await mailService.getAllEmailAdmin();
            sendSuccess(res, email);
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async getFirstCustomerEmail(req: Request, res: Response) {
        try {
            const email = await mailService.getFirstCustomerEmail();
            if (email) {
                sendSuccess(res, email);
            } else {
                sendError(res, 'No customer email found');
            }
        } catch (error: any) {
            sendError(res, error.message);
        }
    }

    async getFirstAdminEmail(req: Request, res: Response) {
        try {
            const email = await mailService.getFirstAdminEmail();
            if (email) {
                sendSuccess(res, email);
            } else {
                sendError(res, 'No admin email found');
            }
        } catch (error: any) {
            sendError(res, error.message);
        }
    }

    async updateFirstCustomerEmail(req: Request, res: Response) {
        try {
            const updatedEmail: e_mail = req.body;
            if (!updatedEmail.email || !updatedEmail.subject || !updatedEmail.body || !updatedEmail.type_email) {
                return sendError(res, 'All fields are required.');
            }
            const email = await mailService.updateFirstCustomerEmail(updatedEmail);
            sendSuccess(res, email);
            console.log(req.body);
        } catch (error: any) {
            sendError(res, error.message);
        }
    }

    async updateFirstAdminEmail(req: Request, res: Response) {
        try {
            const updatedEmail: e_mail = req.body;
            if (!updatedEmail.email || !updatedEmail.subject || !updatedEmail.body || !updatedEmail.type_email) {
                return sendError(res, 'All fields are required.');
            }
            const email = await mailService.updateFirstAdminEmail(updatedEmail);
            sendSuccess(res, email);
            console.log(req.body);
        } catch (error: any) {
            sendError(res, error.message);
        }
    }



}

export default new emailController();
