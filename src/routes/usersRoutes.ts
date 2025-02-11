import { Router } from "express";
import userController from "../controllers/userController";

const usersRouter = Router();
usersRouter.get('/getAllUsers', userController.getAllUsers);
usersRouter.get('/getById/:id', userController.getUserById);
usersRouter.post('/postUser', userController.postUser);
usersRouter.delete('/deleteUser/:id', userController.deleteUser);
usersRouter.put('/updateUser/:id', userController.updateUser);
usersRouter.put('/updateUserPassword/:id', userController.updateUserPassword);
usersRouter.get('/getUsersByType/:type', userController.getUsersByType);
usersRouter.get('/getUsersByRole/:role', userController.getUsersByRole);
usersRouter.get('/getUsersByEmail/:email', userController.getUsersByEmail);


export default usersRouter; 