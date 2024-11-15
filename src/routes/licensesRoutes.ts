import { Router } from "express";
import licenseController from "../controllers/licenseController";

const licenseRouter = Router();

licenseRouter.get('/:element', licenseController.getLicenseByItem);
licenseRouter.post('/postLicenza', licenseController.postLicenza);
licenseRouter.put('/booking/:salesDoc/:item/:key/:stato', licenseController.putLicense);
licenseRouter.put('/sended/:key/:stato', licenseController.putLicenseSended);
licenseRouter.get('/pack/:salesDoc', licenseController.getLicensePack);
licenseRouter.get('/email/:salesDoc', licenseController.getEmailOrdering);
licenseRouter.get('/import/licenses', licenseController.importLicenses);
/* sended
licenseRouter.get('/', licenseController.getAlllicense);
productRouter.post('/', productController.postProduct);
 productRouter.put('/:id', productController.putProduct);
productRouter.delete('/:id', productController.deleteProduct); */

export default licenseRouter;