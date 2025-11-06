import { Router } from "express";
import {enrollUser}  from "../controllers/enroll.controller.js";  


export const enrollRouter = Router()

enrollRouter.post("/enrolls", enrollUser)



