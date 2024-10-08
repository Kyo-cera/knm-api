import { Router } from "express";
import customerController from "../controllers/customerController";

const customersRouter = Router();


customersRouter.get('/:id', customerController.getCustomerByItem);
customersRouter.get('/', customerController.getAllCustomers);
customersRouter.post('/',customerController.postCustomer);
/*
orderRouter.get('/:id', orderController.getAllOrders);


orderRouter.post('/', orderController.getAllOrders); //
 orderRouter.put('/:id', productController.putProduct);
orderRouter.delete('/:id', productController.deleteProduct); */

export default customersRouter; 