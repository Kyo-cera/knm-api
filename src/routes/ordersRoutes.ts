import { Router } from "express";
import orderController from "../controllers/orderController";

const orderRouter = Router();

//orderRouter.get('/salesOrders', orderController.getAllSalesOrders);
orderRouter.get('/sales', orderController.getAllSalesOrders);
orderRouter.get('/check/:salesdoc/:item/:dibi', orderController.getCheckDibi);
orderRouter.get('/salesCheckData', orderController.getSalesData);
orderRouter.get('/listSalesDoc/:salesdoc', orderController.getOrderListxDoc);
orderRouter.get('/cart', orderController.getOrdersList);
orderRouter.get('/', orderController.getAllOrders);
orderRouter.get('/:salesdoc', orderController.getByIdOrders);

/*
orderRouter.post('/', orderController.getAllOrders); //
 orderRouter.put('/:id', productController.putProduct);
orderRouter.delete('/:id', productController.deleteProduct); */

export default orderRouter;