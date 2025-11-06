import mongoose  from "mongoose";



const attendanceSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    status:{
        type: String,
        enum:["present", "absent"],
        required: true

    },
},

{
        _id: false
}

);





const enrollSchema = new mongoose.Schema({
    Firstname:{
        type: String,
        required: true,
        trim: true,
        minLength: [2, "Name must be at least 2 characters"],
    },

    Lastname:{
        type: String,
        required: true,
        trim: true,
        minLength: [2, "Name must be at least 2 characters"],
    },
    email:{
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        minLength: [5, "Email must be at least 5 characters"],
        match: [/\S+@\S+\.\S+/, ], 
    },

    phoneNumber:{
        type: Number,
        unique: true,
        trim: true,
        maxlength: [10, "Phone-number must be at least 10 characters"],
        match: [/^\+?[1-9]\d{1,14}$/],
        required:[ true, "Phone-number is required"]
    },

    gender:{
        type: String,
        enum: [
            "Male",
            "Female"
        ],
        required:[true, "Gender is required"]
    },
    

    learningTrack:{
         type: String,
        enum: [
            "Backend Development",
            "Fullstack Development",
            "Data Analytics",
            "Cloud Computing",
            "Cyber Security"
        ],
        required:[ true, "Track is required"]
    },

    attendance: {
        type: [attendanceSchema],
        default: []
    }
    
},
    {timestamps: true},
);

enrollSchema.index({email: 1});
enrollSchema.index({"attedance.date": 1})

// Combines firstName and lastName toghether
enrollSchema.virtual("fullname").get(function (){
    return `${this.Firstname} ${this.Lastname}`
});

enrollSchema.methods.getAttendancePercentage = function(){

    //Step 1: Check if student has any attendance record
    if (this.attendance.length === 0) return 0; 

    //Step 2: Count how many times they were present
    const presentCount = this.attendance.filter((record) => record.status === "present").length;

    //Step: 3 Calculate the percentage 
    // Formula: (present days/ total days) * 100
    return ((presentCount / this.attendance.length) * 100).toFixed(2)
}

// Method to get attendance by date range
// You want to grt attendance for November 2025
// Const startDate = new Date ("2025-11-01")
// Const endDate = new Date ("2025-22-30")
enrollSchema.methods.getAttendanceByDateRange = function (startDate, endDate){
    return this.attendance.filter((record)=>{
        const recordDate = new Date(record.date);
        return recordDate >= startDate && recordDate <= endDate;
    })
};

enrollSchema.statics.findLowAttendanceStudents = async function (threshold = 75){
    // Step 1: Get all students from Database
    const students = await this.find({});

    // Step 2: Filter all the students with attendance below threshold
    return students.filter((students) =>{
        const percentage = students.getAttendancePercentage();
        return parseFloat(percentage) < threshold
    })
}


const enroll = mongoose.model("Enroll", enrollSchema );
export default enroll;

// import mongoose from "mongoose";

// const attendanceSchema = new mongoose.Schema({
//     date: {
//         type: Date,
//         required: true
//     },
//     status: {
//         type: String,
//         enum: ["present", "absent"],
//         required: true
//     }
// }, { _id: false });

// const enrollSchema = new mongoose.Schema({
//     Firstname: {
//         type: String,
//         required: true,
//         trim: true,
//         minLength: [2, "Name must be at least 2 characters"],
//     },
//     Lastname: {
//         type: String,
//         required: true,
//         trim: true,
//         minLength: [2, "Name must be at least 2 characters"],
//     },
//     email: {
//         type: String,
//         required: true,
//         unique: true,
//         lowercase: true,
//         trim: true,
//         match: [/\S+@\S+\.\S+/, "Invalid email format"],
//     },
//     phoneNumber: {
//         type: String,
//         unique: true,
//         trim: true,
//         match: [/^\d{10,14}$/, "Phone number must be 10-14 digits"],
//         required: [true, "Phone number is required"],
//     },
//     gender: {
//         type: String,
//         enum: ["Male", "Female"],
//         required: true,
//     },
//     learningTrack: {
//         type: String,
//         enum: [
//             "Backend Development",
//             "Fullstack Development",
//             "Data Analytics",
//             "Cloud Computing",
//             "Cyber Security"
//         ],
//         required: true,
//     },

//     attendance: {
//         type: [attendanceSchema],
//         default: []
//     }

// }, { timestamps: true });

// /* ========= INDEXES ========= */
// enrollSchema.index({ email: 1 });
// enrollSchema.index({ "attendance.date": 1 });

// /* ========= VIRTUALS ========= */
// enrollSchema.virtual("fullname").get(function () {
//     return `${this.Firstname} ${this.Lastname}`;
// });

// /* ========= METHODS ========= */
// // Attendance percentage
// enrollSchema.methods.getAttendancePercentage = function () {
//     if (this.attendance.length === 0) return 0;
//     const present = this.attendance.filter(r => r.status === "present").length;
//     return ((present / this.attendance.length) * 100).toFixed(2);
// };

// // Attendance by date range
// enrollSchema.methods.getAttendanceByDateRange = function (startDate, endDate) {
//     return this.attendance.filter(record => {
//         const d = new Date(record.date);
//         return d >= startDate && d <= endDate;
//     });
// };

// /* ========= STATICS ========= */
// // Find students below attendance threshold
// enrollSchema.statics.findLowAttendanceStudents = async function (threshold = 75) {
//     const students = await this.find({});
//     return students.filter(student =>
//         parseFloat(student.getAttendancePercentage()) < threshold
//     );
// };

// export default mongoose.model("Enroll", enrollSchema);
