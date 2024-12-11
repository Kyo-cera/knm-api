import { Request, Response } from 'express';
import userService from "../services/usersService";
import { sendError, sendSuccess } from '../utils/requestHandlers';
class userController{

    async getAllUsers(req: Request, res: Response){
        try{
            const users = await userService.getAllUsers();
            sendSuccess(res, users);
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async getUserById(req: Request, res: Response){
        try{
            const id = Number(req.params['id']);
            console.log('element: ->:  '+id);
            const user = await userService.getUserById(id);
            if(user){
                sendSuccess(res, user);
            }else{
                sendError(res, `ID not found`, 404);
            }
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async postUser(req: Request, res: Response){
        try{
            const data = req.body;
            const user = await userService.postUser(data); 
           console.log(user); 
            if(user){
                sendSuccess(res, user);
            }else{
                sendError(res, `User not created`, 500);
            }
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async deleteUser(req: Request, res: Response){
        try{
            const id = Number(req.params['id']);
            const user = await userService.deleteUser(id); 
           console.log(user); 
            if(user){
                sendSuccess(res, user);
            }else{
                sendError(res, `User not deleted`, 500);
            }
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async updateUser(req: Request, res: Response){
        try{
            const data = req.body;
            const id = Number(req.params['id']);
            const user = await userService.updateUser(id, data); 
           console.log(user); 
            if(user){
                sendSuccess(res, user);
            }else{
                sendError(res, `User not updated`, 500);
            }
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async updateUserPassword(req: Request, res: Response){
        try{
            const data = req.body;
            const id = Number(req.params['id']);
            const user = await userService.updateUserPassword(id, data); 
           console.log(user); 
            if(user){
                sendSuccess(res, user);
            }else{
                sendError(res, `User not updated`, 500);
            }
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async getUsersByType(req: Request, res: Response){
        try{
            const type = String(req.params['type']);
            console.log('element: ->:  '+type);
            const user = await userService.getUsersByType(type);
            if(user){
                sendSuccess(res, user);
            }else{
                sendError(res, `type not found`, 404);
            }
        }catch(error: any){
            sendError(res, error.message);
        }
    }

    async getUsersByRole(req: Request, res: Response){
        try{
            const role = String(req.params['role']);
            console.log('element: ->:  '+role);
            const user = await userService.getUsersByRole(role);
            if(user){
                sendSuccess(res, user);
            }else{
                sendError(res, `type not found`, 404);
            }
        }catch(error: any){
            sendError(res, error.message);
        }
    }

}
export default new userController();