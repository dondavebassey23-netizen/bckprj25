import express from "express";
import { ConnectDb } from "./database/mongodb.js";
import {PORT} from "./config/env.js";
import  authRouter  from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import {enrollRouter} from "./routes/enroll.route.js";
import attendanceRouter from "./routes/attendance.route.js";


dotenv.config();    


const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: "http://localhost:5000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: false,
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.urlencoded({ extended: true }));

;

app.use("/api/v1/auth", authRouter);
app.use("/api/v1", enrollRouter);
app.use("/api/v1/attendance", attendanceRouter);
    
app.listen(PORT, async () => {
    console.log(`Server running`);
    await ConnectDb();
});

// export default app