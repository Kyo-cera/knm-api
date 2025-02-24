import { Request, Response } from 'express';
import mailService from "../services/mailService";
import { sendError, sendSuccess } from '../utils/requestHandlers';
import { e_mail } from 'models/e-mail';
import { EmailData } from '../models/email';
import emailServices from '../services/emailService';
import emailManagment from '../services/emailManagment';
import { writeToLog } from '../utils/writeLog';

class emailController{

    async getAllEmail(req: Request, res: Response){
        try{
            const email = await mailService.getAllEmail();
            sendSuccess(res, email);
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async getEmailByType(req: Request, res: Response){
        try{
            const tipo = String(req.params['tipo']);
            const email = await mailService.getEmailByType(tipo);
            sendSuccess(res, email);
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async getEmailById(req: Request, res: Response){
        try{
            const id = Number(req.params['id']);
            const email = await mailService.getEmailById(id);
            sendSuccess(res, email);
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async postEmail(req: Request, res: Response): Promise<void>{
            const data: e_mail = req.body;
            try {
                await mailService.postMail(data); 
                res.status(201).send({ message: 'Email caricata con successo' }); 
            } catch (error) {
                console.error('Errore durante l\'inserimento della email:', error);
                res.status(500).send({ error: 'Errore durante l\'inserimento dell\'email' }); 
            }
        
    }

    async updateByID(req: Request, res: Response): Promise<void> {
        const id = Number(req.params['id']);
        const data: e_mail = req.body;
    
        try {
            await mailService.updateByID(data, id);
            res.status(200).send({ message: 'Email aggiornata o creata con successo' }); 
        } catch (error) {
            console.error('Errore durante l\'upsert della email:', error);
            res.status(500).send({ error: 'Errore durante l\'upsert dell\'email' }); 
        }
    }
    

    async getEmails(req: Request, res: Response){
        try{
            const mails = await emailServices.getEmails();
            sendSuccess(res, mails);
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async invioEmail(req: Request, res: Response){
        const data: EmailData = req.body;
        try{
            const email = await mailService.invioEmail(data);
            sendSuccess(res, email);
        }catch(error: any){
            sendError(res, error.message);
        }
    }

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

export default new emailController();
