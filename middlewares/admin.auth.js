// import jwt from "jsonwebtoken";
// import { JWT_SECRET } from "../config/env.js"; 


// export const adminAuth =async(req, res, next) => {
//     try {
//         const authHeader = req.headers.authorization;
//         if (!authHeader || !authHeader.startsWith("Bearer ")) {
//             return res.status(401).json({ message: "Unauthorized: No token provided" });
//         }
//         const token = authHeader.split(" ")[1];
//         const decoded = jwt.verify(token, JWT_SECRET);
//         if (!decoded || !decoded.isAdmin) {
//             return res.status(403).json({ message: "Forbidden: Admin access required" });
//         }
//         next();
//     } catch (error) {
//         return res.status(401).json({ message: "Unauthorized: Invalid token" });
//     }
// };

import jwt from "jsonwebtoken";
import { JWT_SECRET } from "../config/env.js";

export const adminAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;

    // No token provided
    if (!authHeader?.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);

        // User is not admin
        if (!decoded.isAdmin) {
            return res.status(403).json({ message: "Admin access only" });
        }

        req.auth = decoded; // optional: so routes can use user data
        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};

// Alternative implementation

// export const adminAuth = (req, res, next) => {
//     try {
//         const token = req.headers.authorization?.split(" ")[1];
//         if (!token) return res.status(401).json({ message: "No token provided" });

//         const decoded = jwt.verify(token, process.env.JWT_SECRET);

//         req.auth = decoded;   // <-- IMPORTANT

//         if (!decoded.isAdmin) {
//             return res.status(403).json({ message: "Admins only" });
//         }

//         next();

//     } catch (error) {
//         return res.status(401).json({ message: "Invalid token" });
//     }
// };
