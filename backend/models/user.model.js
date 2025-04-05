const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const userSchema = new mongoose.Schema({
    fullName: { 
        type: String, 
        required: true 
    },
    email: 
    { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: 
    { 
        type: String, 
        required: true 
    },
    role: 
    { 
        type: String, 
        enum: ["Admin", "User"], 
        default: "User" 
    },
    isActive: { 
        type: Boolean, 
        default: true 
    },
}, 
{ timestamps: true }
);
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password,this.password)
}
userSchema.methods.getSignedJwtToken = function () {
    return jwt.sign(
        { id: this._id, role: this.role },
        process.env.JWT_SECRET,
        { expiresIn: "1d" }
    );
};

module.exports = mongoose.model("User", userSchema);
