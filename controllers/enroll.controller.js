
import mongoose from "mongoose";
import enroll from "../models/enroll.model.js"

export const enrollUser = async (req, res, next) => {

    
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { Firstname, Lastname, email, phoneNumber, gender, learningTrack } = req.body;

        // Check if any detail is missing
        if (!Firstname || !Lastname || !email || !phoneNumber || !gender || !learningTrack) {
            return res.status(400).json({ message: "All fields are mandatory" });
        }

        // check if user exists
        const existingUser = await enroll.findOne({ email }).session(session);
        if (existingUser) {
            return res.status(400).json({ message: "User already exists!" });
        }

            // Creating new users
        const newUser = await enroll.create([{
            Firstname, Lastname, email, phoneNumber, gender, learningTrack
        }], { session });

        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ message: "User created successfully" });

    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        next(error);
    }
};


//Helper function to prevent marking attendance on Saturdays and Sundays

const isWeekend = (date)=>{
    const day = date.getDay()
    return day === 0 || day === 6
    // Sunday is 0, Saturday is 6
}

// Helper function to know te start of the day
const getStartOfDay = (date)=>{
    const start = new Date(date)
    start.setHours(0,0,0,0);
    return start
}

// Helper function to know end of the day
const getEndOfDay =(date)=>{
    const end = new Date(date);
    end.setHours(23,59,99,999);
    return end
}

// Helper function to get working days range (MON-FRI)
const getWorkingDays =(startDate, EndDate)=>{
    const workingDays = [];
    const current = new Date(startDate)
    while (current <= EndDate) {
        if (!isWeekend(current)) {
            workingDays.push(new Date(current))
        }
        current.setDate(current.getDate() + 1)
    }
    return workingDays;
};

export const markAttendance = async (req, res, next)=>{
    try {
        const {email} = req.body;

        if(!email)
            return res.status(400).json({message: "Email is required"})

        // Validation - Check if student is enrolled
        const student = await enroll.findOne({email});

        if (!student) {
           return res.status(400).json({message: "Student not found!"}) 
        }

        const today = new Date()
        console.log

        // Check if today is weekend
        if(isWeekend(today)){
            return res.status(400).json({message: "Attendance cannot be marked on weekend!"})
        }

        // Prevent students from marking attendance twice
        // This means startOfDay is 0.00 midnight
        // This meeans endOfDay is 11:59pm today
        // So we are creating a time  range that represent today only
        
        const startOfDay = getStartOfDay(today)
        const endOfDay = getEndOfDay(today)
        const allreadyMarked = student.attendance.some((record) =>{
            const recordDate = new Date(record.date);
            return recordDate >= startOfDay && recordDate <= endOfDay;
        })

        if (allreadyMarked) {
            return res.status(400).json({message: "Attendance already marked!"})
        }

        // Mark the student present
        student.attendance.push({
            date: today,
            status: "present"
        })

        // sace it 
        await student.save();

        return res.status(200).json({message: "Attendance marked Successfully!",
            attendance: {
                date: today,
                status: "present"
            }
        })
      



    } catch (error) {
        return res.status(500).json({message: "Something went wrong!", error: error.message})
    }
}

export const autoMarkabsence = async (req, res, next)=>{

}

export const getOverallAttendance = async (req, res, next) => {
    
}


export const getAllStudentWithAttendance = async (req, res, next) => {
    
}


export const getStudentAttendance = async (req, res, next) => {
    
}