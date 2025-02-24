import { Request, Response } from 'express';
import cartService from '../services/cartService';
import orderService from '../services/orderService';
import { sendError, sendSuccess } from '../utils/requestHandlers';
import { writeToLog } from '../utils/writeLog';
class OrderController{

    async getAllOrders(req: Request, res: Response){
        try{
            const orders = await orderService.getAllOrders();
            sendSuccess(res, orders);
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async importOrders(req: Request, res: Response){
        try{
            const response = await orderService.importOrders();
            sendSuccess(res, response);
        }catch(error: any){
            sendError(res, error.message);
        }
    }


    async getByIdOrders(req: Request, res: Response){
        try{
            const salesdoc = String(req.params['salesdoc']);
            const orders = await orderService.getOrderByItemSalesDoc(salesdoc);
            sendSuccess(res, orders);
        }catch(error: any){
            sendError(res, error.message);
        }
    }
    
    async getOrdersList(req: Request, res: Response){
        try{
            const pack  = await cartService();
            sendSuccess(res, pack);
        }catch(error: any){
            writeToLog("error ",error.message);
           sendError(res, error.message);
        }
    }
    async getAllSalesOrders(req: Request, res: Response){
        try{
            const orders = await orderService.getAllSalesOrders();
            sendSuccess(res, orders);
        }catch(error: any){
            sendError(res, error.message);
        }
    }
    async getSalesData(req: Request, res: Response){
        try{
            const checkData = await orderService.getOrdersWithoutDestination();
            sendSuccess(res, checkData);
        }catch(error: any){
            sendError(res, error.message);
        }
    }
    async getCheckDibi(req: Request, res: Response){
        try{
            const salesdoc = String(req.params['salesdoc']);
            const item = String(req.params['item']);
            const dibi = String(req.params['dibi']);
            const checkDIBI = await orderService.getCheckDibi(salesdoc,item,dibi);
            sendSuccess(res, checkDIBI);
        }catch(error: any){
            sendError(res, error.message);
        }
    }
    //getOrderListxDoc
    async getOrderListxDoc(req: Request, res: Response){
        try{
            const salesdoc = String(req.params['salesdoc']);
            const orderList = await orderService.getOrderListxDoc(salesdoc);
            sendSuccess(res, orderList);
        }catch(error: any){
            sendError(res, error.message);
        }
    }

}
export default new OrderController();