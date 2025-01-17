import { Router } from "express";
import emailController from '../controllers/emailController';

const emailRoutes = Router();

emailRoutes.get('/', emailController.getAllEmail);
emailRoutes.get('/getEmails', emailController.getEmails);
emailRoutes.get('/byType/:tipo', emailController.getEmailByType);
emailRoutes.get('/:id', emailController.getEmailById);
emailRoutes.post('/addEmail', emailController.postEmail);
emailRoutes.put('/updateByID/:id', emailController.updateByID);
emailRoutes.post('/invioEmail', emailController.invioEmail);
emailRoutes.get('/devMode', emailController.devMode);
emailRoutes.get('/getDevMode', emailController.getDevMode);

export default emailRoutes;