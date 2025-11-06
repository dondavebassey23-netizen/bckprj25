
import mongoose from "mongoose";
import { MONGODB_URL } from "../config/env.js";

export const ConnectDb = async () => {
   try {
         await mongoose.connect(MONGODB_URL)
    console.log('Mongodb connected successfully');
    } catch (error) {
        console.log("Error in connecting Mongodb", error);
        
    }

}