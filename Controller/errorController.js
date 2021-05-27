const AppError = require("./../Utils/appError");

const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path} : ${err.value}.`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/"(.*?)"/);
  const message = `Duplicate field value ${value}. Please use another value`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.error).map((el) => el.message);
  const message = `Invalid input data. ${errors.join(". ")}`;
  return new AppError(message, 400);
};

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

const sendErrorProd = (err, res) => {
  //Operational trusted error, send to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  }
  //Programming error. don't leak details
  else {
    //log error
    console.log("Error", err);
    //Send message to client
    res.status(500).json({
      status: "error",
      message: "Something went very wrong!",
    });
  }
};

const handleJWTError = () =>
  new AppError("Invalid token! Please login again!", 401);

const handleJWTExpiredError = () =>
  new AppError("Your token has expired! Please login again", 401);

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === "production") {
    let error = { ...err };
    if (error.name === "CastError") {
      error = handleCastErrorDB(error);
    }
    //11000 code comes when we send duplicate name in postman
    if (error.code === 11000) {
      error = handleDuplicateFieldsDB(error);
    }

    if (err.name === "ValidationError") {
      error = handleValidationErrorDB(error);
    }
    if ((err.name = "JsonWebTokenError")) {
      error = handleJWTError();
    }
    if ((err.name = "TokenExpiredError")) {
      error = handleJWTExpiredError();
    }
    sendErrorProd(error, res);
  }
  next();
};
