import { Router } from "express";
import scheduleController from "../controllers/scheduleController"

const scheduleRoutes = Router();

scheduleRoutes.post('/scheduleByType/:type', scheduleController.scheduleByType);
scheduleRoutes.get('/getScheduleByType/:type', scheduleController.getScheduleByType);


export default scheduleRoutes;