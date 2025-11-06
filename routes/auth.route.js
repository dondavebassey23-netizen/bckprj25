import { Router } from "express";
import { Signup, Signin } from "../controllers/auth.controllers.js";

const authRouter = Router();

authRouter.post("/signup", Signup);


authRouter.post("/signin", Signin);

export default authRouter;