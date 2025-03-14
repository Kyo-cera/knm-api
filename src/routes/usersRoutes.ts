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
usersRouter.post('/getUsersByEmail', userController.getUsersByEmail);
usersRouter.get('/verifyToken/:token', userController.verifyToken);
usersRouter.get('/authMiddleware/:token', userController.authMiddleware);
usersRouter.get('/verifyUserByEmail/:email', userController.verifyUserByEmail);

export default usersRouter; 