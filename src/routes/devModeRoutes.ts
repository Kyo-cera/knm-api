import { Router } from "express";
import devModeController from '../controllers/devModeController';

const devModeRoutes = Router();

devModeRoutes.get('/devMode', devModeController.devMode);
devModeRoutes.get('/getDevMode', devModeController.getDevMode);

export default devModeRoutes;