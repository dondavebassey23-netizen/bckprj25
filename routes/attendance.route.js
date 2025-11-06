import { Router } from "express";
import { markAttendance } from "../controllers/enroll.controller.js";

 const attendanceRouter = Router();
attendanceRouter.post("/mark-attendance", markAttendance);

export default attendanceRouter