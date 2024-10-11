import { Router } from "express";
import emailController from '../controllers/emailController';

const emailRoutes = Router();

emailRoutes.get('/', emailController.getAllEmail);
emailRoutes.get('/allCustomers', emailController.getAllEmailCustomers);
emailRoutes.get('/allAdmin', emailController.getAllEmailAdmin);
emailRoutes.get('/getFirstCustomer', emailController.getFirstCustomerEmail);
emailRoutes.get('/getFirstAdmin', emailController.getFirstAdminEmail);
emailRoutes.put('/first-customer', emailController.updateFirstCustomerEmail);
emailRoutes.put('/first-admin', emailController.updateFirstAdminEmail);

export default emailRoutes;