import { Router } from "express";
import { markAttendance } from "../controllers/enroll.controller.js";
import { getOverallAttendance } from "../controllers/enroll.controller.js";
import { getAllStudentWithAttendance } from "../controllers/enroll.controller.js";  
import { getStudentAttendance } from "../controllers/enroll.controller.js"; 
import { getAttendanceByTrack } from "../controllers/enroll.controller.js"; 
import { getAttendanceByDateRange} from "../controllers/enroll.controller.js";
import { getAttendanceByName } from "../controllers/enroll.controller.js";  

 const attendanceRouter = Router();
attendanceRouter.post("/mark-attendance", markAttendance);
attendanceRouter.get("/overall-attendance", getOverallAttendance);
attendanceRouter.get("/students-attendance", getAllStudentWithAttendance);
attendanceRouter.get("/student/:id", getStudentAttendance);
attendanceRouter.get("/student-track/:track", getAttendanceByTrack);
attendanceRouter.get("/date-range", getAttendanceByDateRange);
attendanceRouter.get("/student-name/:name", getAttendanceByName);
    

export default attendanceRouter 
