import { Router } from "express";
import { Signup, Signin, adminOnly } from "../controllers/auth.controllers.js";
import { adminAuth } from "../middlewares/admin.auth.js";

const authRouter = Router();

authRouter.post("/signup", Signup);


authRouter.post("/signin", Signin);
authRouter.get("/dashboard", adminAuth, adminOnly, (req, res) => {
    res.status(200).json({ message: `Welcome to your admin dashboard ${req.auth.name}!` });
});

export default authRouter;