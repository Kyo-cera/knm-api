import { Router } from "express";
import deployController from "../controllers/deployController";

const deployRouter = Router();
deployRouter.get('/deployBE', deployController.deployBE);
deployRouter.get('/deployFE', deployController.deployFE);
deployRouter.get('/deployBEPROD', deployController.deployBEPROD);
deployRouter.get('/deployFEPROD', deployController.deployFEPROD);
export default deployRouter; 