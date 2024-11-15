import { Request, Response } from 'express';
import licenseService from '../services/licenseService';
import { sendError, sendSuccess } from '../utils/requestHandlers';
import { License } from 'models/license';

class LicenseController{

    async getAllLicenses(req: Request, res: Response){
        try{
            const license = await licenseService.getAllLicense();
            sendSuccess(res, license);
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async postLicenza(req: Request, res: Response): Promise<void> {
        const licenseData: License = req.body;
        try {
            const license = await licenseService.postLicenza(licenseData);
            sendSuccess(res, license);
        } catch (error: any) {
            sendError(res, error.message);
        }
    }



    async getLicenseByItem(req: Request, res: Response){
        try{
            const element = String(req.params['element']);
            console.log('element: ->:  '+element);
            const license = await licenseService.getLicenseByElement(element);
            if(license){
                sendSuccess(res, license);
            }else{
                sendError(res, `license not found`, 404);
            }
        }catch(error: any){
            sendError(res, error.message);
        }
    }
    async getLicensePack(req: Request, res: Response){
        try{
            const salesDoc = String(req.params['salesDoc']);
            console.log('salesDoc: ->:  '+salesDoc);
            const licenses = await licenseService.getLicensePack(salesDoc);
            if(licenses){
                sendSuccess(res, licenses);
            }else{
                sendError(res, `license not found`, 404);
            }
        }catch(error: any){
            sendError(res, error.message);
        }
    }
//getEmailOrdering
async getEmailOrdering(req: Request, res: Response){
    try{
        const salesDoc = String(req.params['salesDoc']);
        console.log('salesDoc: ->:  '+salesDoc);
        const data = await licenseService.getEmailOrdering(salesDoc);
        if(data){
            sendSuccess(res, data);
        }else{
            sendError(res, `license not found`, 404);
        }
    }catch(error: any){
        sendError(res, error.message);
    }
}

  async putLicense(req: Request, res: Response){
        try{
            const SalesDoc = String(req.params['salesDoc']);
            const item = String(req.params['item']);
            const key = String(req.params['key']);
            const stato = String(req.params['stato']);
            console.log('element: -> '+SalesDoc+' item '+item+' key'+key+' '+stato);
            const license = await  licenseService.putLicense(SalesDoc,item,key,stato);
            console.log('license: -> '+license);
            if(license){
                sendSuccess(res, license);
            }else{
                sendError(res, `License not found`, 404);
            }
        }catch(error: any){
            sendError(res, error.message);
        }
    } 
    async putLicenseSended(req: Request, res: Response){
        try{          
            const key = String(req.params['key']);
            const stato = String(req.params['stato']);
            console.log('element: ->  key'+key+' '+stato);
            const sended = await  licenseService.putLicenseSended(key,stato);
            console.log('license: -> '+sended);
            if(sended){
                sendSuccess(res, sended);
            }else{
                sendError(res, `License not found`, 404);
            }
        }catch(error: any){
            sendError(res, error.message);
        }
    } 

    async importLicenses(req: Request, res: Response){
        try{
            const license = await licenseService.importLicenses();
            sendSuccess(res, license);
        }catch(error: any){
            sendError(res, error.message);
        }
    }

  /* putLicenseSent
      async postProduct(req: Request, res: Response){
        try{
            const data = req.body;
            const license = await licenseService.postLicense(data);
            if(license){
                sendSuccess(res, license);
            }else{
                sendError(res, `license not created`, 500);
            }
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async deleteProduct(req: Request, res: Response){
        try{
            const id = Number(req.params['id']);
            const deleted = await productService.deleteProduct(id);
            if(deleted){
                sendSuccess(res, {});
            }else{
                sendError(res, `Product not found`, 404);
            }
        }catch(error: any){
            sendError(res, error.message);
        }
    } */

}

export default new LicenseController();