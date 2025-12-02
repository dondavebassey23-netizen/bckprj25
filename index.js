import express from "express";
import { ConnectDb } from "./database/mongodb.js";
import {PORT} from "./config/env.js";
import  authRouter  from "./routes/auth.route.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import {enrollRouter} from "./routes/enroll.route.js";
import attendanceRouter from "./routes/attendance.route.js";
import cron from "node-cron";
import {autoMarkabsence} from "./controllers/enroll.controller.js";  


dotenv.config();    


const app = express();
app.use(cookieParser());
app.use(express.json());
app.use(cors({
    origin: ["http://localhost:5000", "http://localhost:3000", "https://ekiti-ict-hub.vercel.app"],

    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.urlencoded({ extended: true }));

cron.schedule('38 22 * * *', async () => {
console.log("Testing Auto marking function");
await autoMarkabsence(null, null);
})

app.use("/api/v1/auth", authRouter);
app.use("/api/v1", enrollRouter);
app.use("/api/v1/attendance", attendanceRouter);
    


app.listen(PORT, async () => {
    console.log(`Server running`);
    await ConnectDb();
});

// export default app