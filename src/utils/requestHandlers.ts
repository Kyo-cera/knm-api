import { Response } from 'express';
import { writeToLog } from './writeLog';
export function sendSuccess(res: Response, data: any){
   // console.log('res:  ',res.status)
    writeToLog('richiesta effettuata con successo', res.statusCode);
    res.status(200).json({
        success: true,
        data: data,
        error: null
    });
}

export function sendError(res: Response, message: string = "Internal server error", statusCode: number = 500){
 
  writeToLog(message,statusCode);
    res.status(statusCode).json({
        success: false,
        data: null,
        error: {
            message: message
        }
    });
}