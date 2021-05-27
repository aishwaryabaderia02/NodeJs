const express = require("express");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const helmet = require("helmet");
const mongoSanitize = require("express-mongo-sanitize");
const xss = require("xss-clean");
const hpp = require("hpp");
const path = require("path");

const tourRouter = require("./routes/tourRoutes");
const userRouter = require("./routes/userRoutes");
const reviewRouter = require("./routes/reviewRoutes");
const appError = require("./Utils/appError");
const globalErrorHandler = require("./Controller/errorController");
const app = express();

app.set("view engine", "pug");
app.set("views", path.join(__dirname, "views"));

//Serving static files
app.use(express.static(path.join(__dirname, "starter/public")));

//GLOBAL Middlewares
//Set Security http headers
app.use(helmet());

//Development logging
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

//Limit request from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: `Too many request from this IP. Please try again in an hour`,
});
app.use("/api", limiter);

//Body Parser. Reading data from the body into req.boy
app.use(express.json({ limit: "10kb" }));

//Data Sanitization against NoSQL query injection
app.use(mongoSanitize());

//Data sanitization against XSS
app.use(xss());

//Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      "duration",
      "ratingsQuantity",
      "ratingsAverage",
      "maxGroupSize",
      "difficulty",
      "price",
    ],
  })
);
// app.use((req, res, next) => {
//   console.log("Hello from the middleware🖐🤘");
//   next();
// });

//Test middleware
app.use((req, res, next) => {
  req.requestedAt = new Date().toISOString();
  next();
});

//ROUTES
// app.get("/", (req, res) => {
//   //res.status(200).send("Hello from the SERVER!");
//   res.status(200).json({ message: "Hello from the SERVER!", app: "natours" });
// });

// app.post("/", (req, res) => {
//   res.send("You can use post endpoint");
// });

// app.get("/api/v1/tours", getAllTours);
// app.post("/api/v1/tours", createTour);
// app.get("/api/v1/tours/:id", getTour);
// app.patch("/api/v1/tours/:id", updateTour);
// app.delete("/api/v1/tours/:id", deleteTour);

//ROUTES

app.get("/", (req, res) => {
  res
    .status(200)
    .render("base", { tour: "The Forest Hiker", user: "Aishwarya" });
});
app.use("/api/v1/tours", tourRouter);
app.use("/api/v1/users", userRouter);
app.use("/api/v1/reviews", reviewRouter);

//Error handeling for routes that couldn't be handled
app.all("*", (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message : `Can't find ${req.originalUrl} on this Server!`
  // })
  // next();

  // const err = new Error(`Can't find ${req.originalUrl} on this Server!`);
  // err.status = "fail";
  // err.statusCode = 404;

  next(new appError(`Can't find ${req.originalUrl} on this Server!`));
});

app.use(globalErrorHandler);

// SERVER
module.exports = app;
