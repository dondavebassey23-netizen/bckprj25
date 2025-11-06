import mongoose from "mongoose";
import auth from "../models/auth.model.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import {JWT_EXPIRES_IN, JWT_SECRET} from "../config/env.js";


export const Signup = async (req, res, next) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const{name, email, password, track} = req.body;

    // check any of the data is missing
    if(!name || !email || !password || !track){
        return res.status(400).json({
            message: "All fields are required"
        });
    }

        // check if user already exists
        const existingUser = await auth.findOne({email}).session(session);
        if(existingUser){
           return res.status(409).json({message: "User already exists"});
        }
            // hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // create new user  
        const newUser = await auth.create([{
            name,
            email,
            password: hashedPassword,
            track
        }], { session });

            // generate jwt token
        const token = jwt.sign(
            { userId: newUser[0]._id, email: newUser[0].email },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

            // commit the transaction to mongoose
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ message: "User created successfully",
            user: {
                userId: newUser[0]._id,
                email: newUser[0].email,
                name: newUser[0].name,
                password: newUser[0].password,
                track: newUser[0].track,
                token: token
            }

        });
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        return res.status(500).json({  message: "Something went wrong", error: error.message });
    }   
}



export const Signin = async (req, res, next) => {
    // const session = await mongoose.startSession();
    // session.startTransaction();

    // try {
    //     const { email, password } = req.body;

    //     // check if user exists
    //     const existingUser = await auth.findOne({ email }).session(session);
    //     if (!existingUser) {
    //         return res.status(404).json({ message: "User not found" });
    //     }

    //     // check if password is correct
    //     const isMatch = await bcrypt.compare(password, existingUser.password);
    //     if (!isMatch) {
    //         return res.status(401).json({ message: "Invalid credentials" });
    //     }

    //     // generate jwt token
    //     const token = jwt.sign(
    //         { userId: existingUser._id, email: existingUser.email },
    //         JWT_SECRET,
    //         { expiresIn: JWT_EXPIRES_IN }
    //     );

    //     // commit the transaction to mongoose
    //     await session.commitTransaction();
    //     session.endSession();

    //     res.status(200).json({
    //         message: "User signed in successfully",
    //         user: {
    //             userId: existingUser._id,
    //             email: existingUser.email,
    //             name: existingUser.name,
    //             track: existingUser.track,
    //             token: token
    //         }
    //     });
    // } catch (error) {
    //     await session.abortTransaction();
    //     session.endSession();
    //     return res.status(500).json({ message: "Something went wrong", error: error.message });
    // }

    try {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const user = await auth.findOne({ email });
        if (!user) {
           return res.status(400).json({message: "user not found"}) 
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(400).json({message: "invalid password"})
        }

        const token = jwt.sign({user: user.id}, JWT_SECRET,{expiresIn: JWT_EXPIRES_IN})

        res.status(200).json({
            success: true,
            message: "signin sucessful",
            token: token,
            data:{
                id:user.id,
                name:user.name,
                email:user.email,
                track:user.track
            }   
        })

    } catch (error) {
        next (error)
    }

};

// import { mongoose } from "mongoose";
// import { auth } from "../models/auth.model";
// import { bcrypt } from "bcryptjs";
// import { jwt } from "jsonwebtoken";
// import { JWT_SECRET,JWT_EXPIRES_IN } from "../config/env.js";


// export const Signup = async (req, res, next) => {
//  const session = await mongoose.startSession();
//  session.startTransaction();

//  try {
//     const{name, email, password, track} = req.body

//     // if details are not found 
//     if (!name || !email || !password || !track) {
//         return res.status(404).json({message: "All fields required"}); 
//     }

//     // if user alredy exist
//     const existingUser = await auth.findOne({email}).session(session)
//     if (existingUser) {
//         return res.status({message: "User already exist!"})
//     }

//  } catch (error) {
    
//  }

    
// }