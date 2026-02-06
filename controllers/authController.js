const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ======================
// GOOGLE CALLBACK
// ======================

exports.googleCallback = async(req, res) => {
    try {
        const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });
        res.json({ message: "Google login successful", token, user: req.user });
    } catch (err) {
        res.status(500).json({ message: "Something went wrong" });
    }
};

exports.logout = (req, res) => {
    req.logout(() => {
        res.json({ message: "Logged out successfully" });
    });
};

// ======================
// REGISTER
// ======================

exports.register = async(req, res) => {
    try {
        const {
            name,
            username,
            email,
            password,
            confirmPassword,
            mobileNumber,
            image,
            gender,
            dob,
        } = req.body;


        if (!name ||
            !username ||
            !email ||
            !password ||
            !confirmPassword ||
            !mobileNumber
        ) {
            return res.status(400).json({ message: "All fields are required" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }


        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already registered" });
        }


        const hashedPassword = await bcrypt.hash(password, 10);


        const newUser = await User.create({
            name,
            username,
            email,
            password: hashedPassword,
            mobileNumber,
            image,
            gender,
            dob,
        });


        const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });

        res.status(201).json({ message: "User registered", user: newUser, token });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
};


// FORGOT PASSWORD
exports.forgotPassword = async(req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user)
            return res.status(404).json({ message: "User not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await Otp.deleteMany({ email });

        await Otp.create({
            email,
            otp,
            expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
        });

        // 🔴 Mail logic yahan aayega (abhi console)
        console.log("OTP:", otp);

        res.json({ message: "OTP sent to email" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};


// RESET PASSWORD
exports.resetPassword = async(req, res) => {
    try {
        const { email, otp, password, confirmPassword } = req.body;

        if (password !== confirmPassword)
            return res.status(400).json({ message: "Passwords do not match" });

        const validOtp = await Otp.findOne({ email, otp });
        if (!validOtp || validOtp.expiresAt < Date.now())
            return res.status(400).json({ message: "Invalid or expired OTP" });

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.updateOne({ email }, { password: hashedPassword });

        await Otp.deleteMany({ email });

        res.json({ message: "Password reset successful" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// ======================
// LOGIN
// ======================

exports.login = async(req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password)
            return res.status(400).json({ message: "Email and password required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User not found" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid password" });

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1d",
        });

        res.json({ message: "Login successful", user, token });
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: "Server error" });
    }
};

// ======================
// PROFILE (protected route)
// ======================
exports.profile = async(req, res) => {
    try {
        const userId = req.user.id; // user must be set in auth middleware
        const user = await User.findById(userId).select("-password");
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};


// UPDATE PROFILE
exports.updateProfile = async(req, res) => {
    try {
        const {
            name,
            username,
            mobileNumber,
            image,
            gender,
            dob
        } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id, {
                name,
                username,
                mobileNumber,
                image,
                gender,
                dob
            }, { new: true }
        ).select("-password");

        res.json({
            message: "Profile updated successfully",
            user: updatedUser
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};


// GET LOGGED-IN USER

exports.getUserById = async(req, res) => {
    try {
        const user = await User.findById(req.params.id).select("-password");

        if (!user)
            return res.status(404).json({ message: "User not found" });

        res.json({ user });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};



// ======================
// LOGOUT
// ======================
exports.logout = (req, res) => {
    req.logout(() => {
        res.json({ message: "Logged out successfully" });
    });
};
