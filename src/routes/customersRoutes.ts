import { Router } from "express";
import customerController from "../controllers/customerController";

const customersRouter = Router();
customersRouter.get('/runAllProcessesPDF', customerController.getCustomerAllPdfProcess);
customersRouter.get('/processJsonFiles', customerController.getCustomerPdfProcess);
customersRouter.get('/updatePdfList', customerController.getCustomerPdfUpdate);
customersRouter.get('/readSalesDocuments', customerController.getCustomerPdfRead);
customersRouter.get('/createListPdf', customerController.getCustomerPdfList);
customersRouter.get('/:id', customerController.getCustomerByItem);
customersRouter.get('/', customerController.getAllCustomers);
customersRouter.get('/', customerController.getAllCustomers);
customersRouter.post('/',customerController.postCustomer);
customersRouter.get('/import/checkCustomer',customerController.getCheckCustomer);
/*
orderRouter.get('/:id', orderController.getAllOrders);


orderRouter.post('/', orderController.getAllOrders); //
 orderRouter.put('/:id', productController.putProduct);
orderRouter.delete('/:id', productController.deleteProduct); */

export default customersRouter; 