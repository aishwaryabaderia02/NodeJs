const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please tell us your name!"],
  },
  email: {
    type: String,
    required: [true, "Please provide your email."],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please provide a valide email."],
  },

  role: {
    type: String,
    enum: {
      values: ["admin", "user", "guide", "lead-guide"],
      message: "",
    },
    default: "user",
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  photo: String,
  password: {
    type: String,
    required: [true, "Please provide password"],
    minlength: 8,
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, "Please confirm your password"],
    validate: {
      validator: function () {
        return this.password === this.passwordConfirm;
      },
      message: "Passwords do not match",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  loginAttempt: {
    type: Number,
    default: 0,
  },
  lockUntil: Date,
});

userSchema.pre("save", function (next) {
  if (this.isModified("password") || this.isNew) return next();
  this.passwordChangedAt = Date.now() - 1000;
  next();
});
//Document midddleware
userSchema.pre("save", async function (next) {
  //Only run this function if password was modified.
  if (!this.isModified("password")) return next();

  //Hashing password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  //Delete password confirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre(/^find/, function (next) {
  //this points to current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changePasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    //check if password was changed after token was issued
    return JWTTimestamp < changedTimestamp;
  }

  //False means not changed
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

  return resetToken;
};

userSchema.methods.lockAccount = function () {
  if (Date.now > this.lockUntil || !this.lockUntil) {
    console.log(this.loginAttempt);
    if (this.loginAttempt === 3) {
      this.lockUntil = new Date(Date.now() + 40 * 1000);
    } else {
      this.loginAttempt += 1;
    }
  }
};

userSchema.methods.unlockAccount = function () {
  if (this.loginAttempt === 0) return;
  this.loginAttempt = 0;
  this.lockUntil = undefined;
};
const User = mongoose.model("User", userSchema);

module.exports = User;
