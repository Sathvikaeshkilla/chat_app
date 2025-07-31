import { generateToken } from "../lib/util.js";
import User from "../models/User.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";
import { checkAuth } from "../middleware/auth.js";

// Signup new user
export const signup = async (req, res) => {
    const { fullName, email, password, bio } = req.body;

    try {
        if (!fullName || !email || !password || !bio) {
            return res.json({ success: false, message: "Missing Details" });
        }

        const user = await User.findOne({ email });
        if (user) {
            return res.json({ success: false, message: "Account already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = await User.create({
            fullName, // ✅ fixed this line
            email,
            password: hashedPassword,
            bio
        });

        const token = generateToken(newUser._id);
        res.json({ success: true, userData: newUser, token, message: "Account created successfully" });

    } catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
};


// controller to login a user
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const userData = await User.findOne({ email });

        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }

        const isPasswordCorrect = await bcrypt.compare(password, userData.password);
        if (!isPasswordCorrect) {
            return res.json({ success: false, message: "Invalid Credentials" });
        }
        const token = generateToken(userData._id);
        res.json({ success: true, userData, token, message: "Login successful" });
    }
    catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}

// controller to check if user is authentiacted
export const checkUserAuth = (req, res) => {    // FIXED export default issue
    res.json({ success: true, user: req.user });
}

// controller to update profile
export const updateProfile = async (req, res) => {
    try {
        const { profilePic, bio, fullName } = req.body;
        const userId = req.user._id;

        let updatedUser;
        if (!profilePic) {
            updatedUser = await User.findByIdAndUpdate(userId, { bio, fullName }, { new: true });  // FIXED method
        }
        else {
            const upload = await cloudinary.uploader.upload(profilePic);
            console.log("Cloudinary Upload URL:", upload.secure_url); 
            updatedUser = await User.findByIdAndUpdate(
                userId,
                { profilePic: upload.secure_url, bio, fullName },   // FIXED method name
                { new: true }
            );
        }
        res.json({ success: true, user: updatedUser });  // FIXED typo succss
    }
    catch (error) {
        console.log(error.message);
        res.json({ success: false, message: error.message });
    }
}
