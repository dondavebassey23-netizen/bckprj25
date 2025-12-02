
import mongoose from "mongoose";
import enroll from "../models/enroll.model.js"


// Controller to enroll a new user
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
    start.setHours(9,0,0,0);
    return start
}

// Helper function to know end of the day
const getEndOfDay =(date)=>{
    const end = new Date(date);
    end.setHours(13,59,59,999);
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


// Controller to mark attendance for a student
export const markAttendance = async (req, res, next)=>{
    try {
        const {email} = req.body;
        // Validation - Check if email is provided
        if(!email)
            return res.status(400).json({message: "Email is required"})

        // Validation - Check if student is enrolled
        const student = await enroll.findOne({email});

        if (!student) {
           return res.status(400).json({message: "Student not found!"}) 
        }

        const today = new Date()
        console.log("Todays Date ", today)

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

        if (today<startOfDay) {
            return res.status(400).json({message: "you cannot mark attendance yet!"})
        }

        if (today>endOfDay) {
            return res.status(400).json({message: "you cannot mark attendance for today anymore!"})
        }

        const allreadyMarked = student.attendance.some((record) =>{
            const recordDate = new Date(record.date);
            return recordDate >= startOfDay && recordDate <= endOfDay;
        })

        if (allreadyMarked) {
            return res.status(400).json({message: "Attendance already marked!"});
            
            
        }

        // Mark the student present
        student.attendance.push({
            date: today,
            status: "present"
        })

        // save it 
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


// Controller for auto-marking absence for students who did not mark attendance by 2pm
export const autoMarkabsence = async (req, res, next)=>{
    try {
        // THis helpd to get to get 
        const today = new Date()

        // Don't run if it's a weekend
        if (isWeekend(today)) {
            const message = "Weekend - No auto-marking needed"
            console.log(message);
            
            if (res) {
               return res.status(200).json({message})
            }
            return;
        }
        
        // This two logics helps to check if the current is between 9am - 1:59pm
        const Daybegins = getStartOfDay(today)
        const DayEnds = getEndOfDay(today)

        // This will return all the list of the student in the database
        const students = await enroll.find({})

        // 
        let MarkedCount = 0;

        for(const student of students){
            const markToday = student.attendance.some((record)=>{
                // Get the date from the record 
                const recordDate = new Date(record.date)
                
            })

                // If ths attendance is not marked! today
        if (!markToday) {
            student.attendance.push({
                date: today,
                status: "absent"
            });

            await student.save();
            MarkedCount++
            console.log(`Auto Marked ${student.email} as absent today ${today.toDateString()}`);
            
        }
        };
        const message = `Auto-marking completed. Total number of students marked absent today is ${MarkedCount}`;
        console.log(message);

    } catch (error) {
        console.error(`Error in auto marking: ${error.message}`);
        
    }

}

//  Controller to calculate overall attendance for all students
export const getOverallAttendance = async (req, res, next) => {
    try {
        // Fetch all students from the database
        const students = await enroll.find({});

        // If there are no students in the DB
        if (students.length === 0) {
            return res.status(404).json({ message: "No students found" });
        }

        // These will store total number of present and absent days for ALL students combined
        let totalPresent = 0;
        let totalAbsent = 0;

        // This array will hold each student's attendance summary
        const summarises = [];

        // Loop through each student to calculate their attendance data
        students.forEach((student) => {

            // Count number of days they were present
            const presentDays = student.attendance.filter(
                record => record.status === "present"
            ).length;

            // Count number of days they were absent
            const absentDays = student.attendance.filter(
                record => record.status === "absent"
            ).length;

            // Total number of attendance records for this student
            const totalDays = presentDays + absentDays;

            // Calculate attendance percentage (avoid division by zero)
            const percentage = totalDays === 0 
                ? 0 
                : ((presentDays / totalDays) * 100);

            // Add this student's counts to the general totals
            totalPresent += presentDays;
            totalAbsent += absentDays;

            // Store individual student summary
            summarises.push({
                studentId: student._id,
                name: `${student.Firstname} ${student.Lastname}`,
                email: student.email,
                gender: student.gender,
                learningTrack: student.learningTrack,
                presentDays,
                absentDays,
                attendancePercentage: percentage
            });
        });

        // Find student with the highest attendance percentage
        const best = summarises.reduce(
            (max, student) =>
                student.attendancePercentage > max.attendancePercentage ? student : max,
            summarises[0] 
        );

        // Find student with the lowest attendance percentage
        const worst = summarises.reduce(
            (min, student) =>
                student.attendancePercentage < min.attendancePercentage ? student : min,
            summarises[0]
        );

        // Calculate average attendance of all students
        const averageAttendance =
            summarises.reduce((sum, student) => sum + student.attendancePercentage, 0) /
            summarises.length;

             // Total number of attendance records for all students
        const totalDaysAllStudents = totalPresent + totalAbsent;

        // Overall attendance percentage for all students combined
        const overallAttendancePercentage = totalDaysAllStudents === 0
            ? 0
            : (totalPresent / totalDaysAllStudents) * 100;


        // Send final report to client (admin)
        return res.status(200).json({
            totalStudents: students.length,
            totalPresent,
            totalAbsent,
            overallAttendancePercentage: Number(overallAttendancePercentage.toFixed(2)),
            averageAttendance: Number(averageAttendance.toFixed(2)),
            bestAttendance: Number(best.attendancePercentage.toFixed(2)),   
            worstAttendance: Number(worst.attendancePercentage.toFixed(2)),
            summarises
        });

    } catch (error) {
        // Handle unexpected server errors
        return res.status(500).json({
            message: "Something went wrong!",
            error: error.message
        });
    }
};


// Controller to get all students with their attendance details
export const getAllStudentWithAttendance = async (req, res, next) => {

    // Log to the server console to show the function was executed
    console.log("fetching all students");

    try {
        // Fetch all students from the database
        const students = await enroll.find({});

        // Process each student to calculate their attendance details
        const results = students.map((student) => {

            // Count how many days the student was marked "present"
            const presentDays = student.attendance.filter(
                record => record.status === "present"
            ).length;

            // Count how many days the student was marked "absent"
            const absentDays = student.attendance.filter(
                record => record.status === "absent"
            ).length;

            // Total attendance records for this student
            const totalDays = presentDays + absentDays;

            // Return a simplified object containing important info
            return {
                studentId: student._id,                              // MongoDB ID
                name: `${student.Firstname} ${student.Lastname}`,    // Full name
                email: student.email,                                // Email
                presentDays,                                         // Number of present days
                absentDays,                                          // Number of absent days
                percentage: student.getAttendancePercentage()        // Attendance percentage (from model method)
            };
        });

        // Send the processed results back to the client
        return res.status(200).json({ students: results });

    } catch (error) {
        // Handle unexpected errors
        return res.status(500).json({
            message: "Something went wrong!",
            error: error.message
        });
    }
};



// Controller to get individual student attendance by ID
export const getStudentAttendance = async (req, res, next) => {

    try {
        const { id } = req.params;  
        // Get the student's ID from the URL parameters

        // Find the student in the database using their ID
        const student = await enroll.findOne({ _id: id }); 

        // If no student was found, send a "Not Found" response
        if (!student) {
            return res.status(404).json({ message: "Student not found" });
        }   

        // Count how many times the student was marked "present"
        const totalPresent = student.attendance.filter(
            record => record.status === "present"
        ).length;   

        // Count how many times the student was marked "absent"
        const totalAbsent = student.attendance.filter(
            record => record.status === "absent"
        ).length;

        // Add present and absent days to get total attendance days
        const totalDays = totalPresent + totalAbsent;

        // Calculate attendance percentage
        // If the student has no attendance records, return 0
        const percentage = totalDays === 0 
            ? 0 
            : ((totalPresent / totalDays) * 100);

        // Send the final response back to the client
        return res.status(200).json({
            name: `${student.Firstname} ${student.Lastname}`, // Student's full name
            presentDays: totalPresent,                        // Number of present days
            absentDays: totalAbsent,                          // Number of absent days
            percentage,                                        // Attendance percentage
            attendanceHistory: student.attendance,             // Full attendance records
        });
    
    } catch (error) {
        // Handle unexpected server errors
        return res.status(500).json({ message: "Something went wrong!", error: error.message });
    }      
}


// Controller to get attendance by learning track
export const getAttendanceByTrack = async (req, res, next) => {
    try {
        // Replace hyphens with spaces → "backend-development" becomes "backend development"
        const track = req.params.track.replace(/-/g, " ");

        // Find students in this specific learning track, case-insensitive match
        const students = await enroll.find({
            learningTrack: new RegExp(`^${track}$`, "i")
        });

        // If no students found, return an error response
        if (students.length === 0) {
            return res.status(404).json({ message: "No students found for this track" });
        }
        
        // Prepare the result for each student in the track
        const result = students.map((student) => {

            // Count how many times the student was marked present
            const presentDays = student.attendance.filter(
                (attendance) => attendance.status === "present"
            ).length;

            // Count how many times the student was marked absent
            const absentDays = student.attendance.filter(
                (attendance) => attendance.status === "absence"
            ).length;

            // Total number of days recorded for this student
            const totalDays = presentDays + absentDays;

            // Return structured attendance data for this student
            return {
                name: `${student.Firstname} ${student.Lastname}`,   // Full name
                email: student.email,                               // Email address
                track: student.track,                                // 
                presentDays,                                        // Total present count
                absentDays,                                         // Total absent count
                percentage: student.getAttendancePercentage()       // Attendance %
            };
        });

        // Send the final response with all students' attendance in this track
        return res.status(200).json({
            message: `Attendance for track: ${track} fetched successfully`,
            count: result.length,
            data: result
        });

    } catch (error) {
        // Catch any server-side error and return 500 response
        res.status(500).json({ message: "Something went wrong!", error: error.message });
    }
};


// export const getAttendanceByDateRange = async (req, res, next) => {

//     try {
//         // Extract start and end date from query parameters (e.g., ?start=2025-01-01&end=2025-01-31)
//         const { range, start, end } = req.query;

//         // Ensure both dates are provided
//         if (!start || !end) {
//             return res.status(400).json({ message: "Start and end dates are required" });
//         }

//         // Convert the start and end strings into Date objects
//         const startDate = new Date(start);
//         const endDate = new Date(end);

//         // Set end day to 23:59:59 to include the entire day in the range
//         endDate.setHours(23, 59, 59, 999);

//         // Validate date formats
//         if (isNaN(startDate) || isNaN(endDate)) {
//             return res.status(400).json({ message: "Invalid date format" });
//         }

//         // Fetch all students with only selected fields
//         const students = await enroll.find({}, {
//             Firstname: 1,
//             Lastname: 1,
//             email: 1,
//             gender: 1,
//             track: 1,
//             attendance: 1,
//         });

//         // Go through each student and filter their attendance based on date range
//         const findStudents = students
//             .map(student => {

//                 // Filter attendance records that fall within the given date range
//                 const filteredStudents = student.attendance.filter(record => {
//                     const recordDate = new Date(record.date);
//                     return recordDate >= startDate && recordDate <= endDate;
//                 });

//                 // Only return students who have attendance records in this date range
//                 if (filteredStudents.length > 0) {
//                     return {
//                         name: `${student.Firstname} ${student.Lastname}`,
//                         email: student.email,
//                         gender: student.gender,
//                         track: student.track,
//                         attendanceCount: filteredStudents.length
//                     };
//                 }

//                 // Return null for students without attendance in this date range
//                 return null;
//             })

//             // Remove null entries from the array
//             .filter(Boolean);

//         // Send success response with total count and filtered student data
//         return res.status(200).json({
//             message: "Students fetched successfully",
//             attendanceCount: findStudents.length,
//             data: findStudents
//         });

//     } catch (error) {
//         // Handle server errors
//         return res.status(500).json({ message: "Something went wrong!", error: error.message });
//     }
// };



export const getAttendanceByDateRange = async (req, res, next) => {

    try {
        // Extract start and end date from query parameters (e.g., ?start=2025-01-01&end=2025-01-31)
        const { range, start, end } = req.query;

        // apo/v1/attendance/filter?range=7days
        let startDate, endDate = new Date();
        endDate.setHours(23, 59, 59, 999);


        // Handle predefined ranges like "7d" for 7 days, "4w" for 4 weeks, etc.
        if (range && range !== "custom") {
            const number = parseInt(range); // extract the number from string and converts it to JS number
            const unit = range.slice(-1) // extract the alphabet in the range string

            if (unit === 'd') {
                startDate = new Date()

                startDate.setDate(startDate.getDate() - number)

            } else if (unit === 'w') {
                startDate = new Date()

                startDate.setDate(startDate.getDate() - (number * 7))
         } else{
            return res.status(400).json({ message: "Invalid date format" });
         }
        }

        if (range === 'custom') {
          if (!start || !end) {
            return res.status(400).json({ message: "Start and end dates are required" });
        }
            // Convert the start and end strings into Date objects
         startDate = new Date(start);
         endDate = new Date(end);

        // Set end day to 23:59:59 to include the entire day in the range
        endDate.setHours(23, 59, 59, 999);

        }

        
        // Validate date formats
        if (!startDate) {
            return res.status(400).json({ message: "start date is missing" });
        }

        // Fetch all students with only selected fields
        const students = await enroll.find({}, {
            Firstname: 1,
            Lastname: 1,
            email: 1,
            gender: 1,
            learningTrack: 1,
            attendance: 1,
        });

        // Go through each student and filter their attendance based on date range
        const findStudents = students
            .map(student => {

                // Filter attendance records that fall within the given date range
                const filteredStudents = student.attendance.filter(record => {
                    const recordDate = new Date(record.date);
                    return recordDate >= startDate && recordDate <= endDate;
                });

                // Only return students who have attendance records in this date range
                if (filteredStudents.length > 0) {
                    return {
                        name: `${student.Firstname} ${student.Lastname}`,
                        email: student.email,
                        gender: student.gender,
                        learningTrack: student.learningTrack,
                        attendanceCount: filteredStudents.length,
                        presence: filteredStudents.filter(s => s.status === "present").length,
                        absence: filteredStudents.filter(s => s.status === "absent").length,
                        records: filteredStudents
                    };
                }

                // Return null for students without attendance in this date range
                return null;
            })

            // Remove null entries from the array
            .filter(Boolean);

        // Send success response with total count and filtered student data
        return res.status(200).json({
            message: "Students fetched successfully",
            attendanceCount: findStudents.length,
            data: findStudents
        });

    } catch (error) {
        // Handle server errors
        return res.status(500).json({ message: "Something went wrong!", error: error.message });
    }
};


// Controller to get attendance for a specific student by their name
        // export const getAttendanceByName = async (req, res) => {
        //     try {
        //         // Extract the "name" parameter from the URL
        //         const { name } = req.params;

        //         // If no name was provided in the request, return an error
        //         if (!name) {
        //             return res.status(400).json({ message: "Student name is required" });
        //         }

        //         // Search for a student using a case-insensitive match.
        //         // ^ and $ ensure exact match, not partial.
        //         const student = await enroll.findOne({ 
        //             name: { $regex: new RegExp("^" + name + "$", "i") }
        //         });

        //         // If the student does not exist, return a 404 response
        //         if (!student) {
        //             return res.status(404).json({ message: "Student not found" });
        //         }

        //         // If student exists, return their attendance records
        //         return res.status(200).json({
        //             message: "Attendance fetched successfully",
        //             attendance: student.attendance
        //         });

        //     } catch (error) {
        //         // Log the error to the server console for debugging
        //         console.error(error);

        //         // Return generic server error to the client
        //         res.status(500).json({ message: "Server error", error: error.message });
        //     }
        // };

export const getAttendanceByName = async (req, res) => {

    try {
        // Extract the "name" parameter from the URL
        const { search } = req.query;

        // If no name was provided in the request, return an error
        if (!search) {
            return res.status(400).json({ message: "search key is required" });
        }

        // Search for a student using a case-insensitive match.
        const regex = new RegExp(search, "i");
        const students = await enroll.find({
            $or: [
                {Firstname: regex},
                {Lastname: regex}
            ]
        },
        {
            Firstname: 1,
            Lastname: 1,
            email: 1,
            gender: 1,
            learningTrack: 1,
            attendance: 1
        }
    )

    if (students.length === 0){
        return res.status(404).json({message: "Name is not found"})
    }

    if (students.length === 0) {
            return res.status(404).json({ message: "No students found for this track" });
        }
        
        // Prepare the result for each student found
        const results = students.map(student => ({
            name: `${student.Firstname} ${student.Lastname}`,
            email: student.email,
            gender: student.gender,
            learningTrack: student.learningTrack,
            attendanceCount: student.attendance.length,
            presence: student.attendance.filter(s => s.status === "present").length,
            absence: student.attendance.filter(s => s.status === "absent").length,
            records: student.attendance
        }));

        res.status(200).json({message: "Attendance filtered by name suceffully.",
            count: results.length,
            data: results
        });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Server error", error: error.message });
    }

}
