const express = require("express");
const passport = require("passport");
const router = express.Router();


const {
    googleCallback,
    logout,
    register,
    login,
    forgotPassword,
    resetPassword,
    profile,
    updateProfile,
    getUserById
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

// =====================
// GOOGLE LOGIN
// =====================
router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    googleCallback
);



router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/profile", protect, profile);
router.put("/profile/update", protect, updateProfile);
router.get("/logout", logout);
router.get("/user/:id", protect, getUserById);


module.exports = router;