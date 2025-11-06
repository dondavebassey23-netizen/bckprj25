// import mongoose from "mongoose";

// const adminSchema = new mongoose.Schema({
//     name:{
//         type:String,
//         require: true,
//         trim: true,
//         minLenght: [4, "name must be at least 4 characters"],
//         maxLength: [30, "name must be at least 30 characters"]
//     },
//     email:{
//         type: String,
//         require: [true, "Email is required"],
//         unique: true,
//         trim: true,
//         lowercase: true,
//         minLenght: [10, "Email must be at least 5 characters"],
//         maxLength: [50, "Email must be at most 50 characters"],
//         match: [/\S+@\S+\.\S+/, ],

//     },
//     password:{
//         type: String,
//         required: [true, "Password is required"],
//         minLenght: [8, "Password must be at least 8 characters"],
//         maxLength: [30, "Password must contain at most 30 characters"]
//     },
//     tracks:{
//         type:Strings,
//         enum: [
//             "Data Analytics",
//             "Cloud Computing",
//             "Backend Development",
//             "Fullstack Development",
//             "Cyber Security"
//         ],
//         require:[ true, "Track is required"]
//     }


// },
//     { timestamps: true}
// );

// const admin = mongoose.model("Admin", adminSchema);
// export default admin

import mongoose from "mongoose";


const authSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
        minLength: [4, "Name must be at least 4 characters"],
       
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        minLength: [5, "Email must be at least 5 characters"],
        match: [/\S+@\S+\.\S+/, ], 
    },
    password: {
        type: String,
        required: [true,"password is required"],
        minLength: [8, "Password must be at least 5 characters" ],
    },
    track: {
        type: String,
        enum: [
            "Backend Development",
            "Fullstack Development",
            "Data Analytics",
            "Cloud computing",
            "Cyber Security"
        ],
        required:[ true, "Track is required"]
    }
},
    {timestamps : true}
);

const auth = mongoose.model("auth",authSchema );
export default auth