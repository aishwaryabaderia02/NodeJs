const { promisify } = require("util");
const User = require("../models/userModel");
const catchAsync = require("./../Utils/catchAsync");
const jwt = require("jsonwebtoken");
const AppError = require("./../Utils/appError");
const sendEmail = require("./../Utils/email");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOption = {
    expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") cookieOption.secure = true;

  res.cookie("jwt", token, cookieOption);

  //Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    role: req.body.role,
    passwordConfirm: req.body.passwordConfirm,
    passwordChangedAt: req.body.passwordChangedAt,
  });
  createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //1 Check if email and password exist
  if (!email || !password) {
    return next(new AppError("Please provide email and password!", 400));
  }

  // const userExists = await User.findOne({ email }).select("+password");
  // if (
  //   userExists &&
  //   !(await userExists.correctPassword(password, userExists.password))
  // ) {
  //   if (userExists.lockUntil < Date.now()) {
  //     return next(
  //       new AppError(
  //         `Your Account is locked.Please try again after ${userExists.lockUntil}`,
  //         429
  //       )
  //     );
  //   }
  //   userExists.lockAccount();
  //   userExists.save({ validateBeforeSave: false });
  // }

  //2 Check is user exists and password is correct
  const user = await User.findOne({ email }).select("+password");
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError("Incorrect email or password", 401));
  }

  //3 If everything is okay send token to the client
  //userExists.unlockAccount();
  //userExists.save({ validateBeforeSave: false });
  createSendToken(user, 200, res);
});

exports.protect = catchAsync(async (req, res, next) => {
  let token;

  //1 get the token and check if it's there
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token)
    return next(
      new AppError("You are not logged in! Please log in to get access"),
      401
    );

  //2 verification of token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //console.log(decoded); //{ id: '6085ad31b6f7df2de894612a', iat: 1619377588, exp: 1627153588 }
  //3 check if user still exists
  const currentUser = await User.findById(decoded.id);
  if (!currentUser)
    return next(new AppError("The user belong to token does not exists!", 401));

  //4 if user change password after jwt was issued
  if (currentUser.changePasswordAfter(decoded.iat))
    return next(
      new AppError("User recently changed password! Please login again!", 401)
    );

  //Grant access to protected route
  req.user = currentUser;
  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    //roles : ["admin",lead-guide],role:user
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(`You do not have permission to perform this action `, 403)
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) Get user based on POSTed email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError("There is no user with email address.", 404));
  }

  // 2) Generate the random reset token
  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) Send it to user's email
  const resetURL = `${req.protocol}://${req.get(
    "host"
  )}/api/v1/users/resetpassword/${resetToken}`;

  const message = `Forgot your password? Submit a PATCH request with your new password and passwordConfirm to: ${resetURL}.\nIf you didn't forget your password, please ignore this email!`;

  try {
    await sendEmail({
      email: user.email,
      subject: "Your password reset token (valid for 10 min)",
      message,
    });

    res.status(200).json({
      status: "success",
      message: "Token sent to email!",
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save({ validateBeforeSave: false });

    return next(
      new AppError("There was an error sending the email. Try again later!"),
      500
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1 Get user based on the token
  const hashedToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  //2 Set new password if token is not expired and user exists
  if (!user) return next(new AppError("Token is invalid or expired!", 300));

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.save();

  //3 Update changed password at property for the current user

  //4 Log the user in. send the jwt web token to the client
  createSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1 Get user from collection
  const user = await User.findById(req.user.id).select("+password");
  console.log(user);

  //2 Check if POSTed password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password)))
    return next(
      new AppError("Incorrect Password! Please provide correct password", 401)
    );

  //3 If so, then update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.save();

  createSendToken(user, 200, res);
});
