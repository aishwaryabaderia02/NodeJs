const mongoose = require("mongoose");
const dotenv = require("dotenv");

process.on("uncaughtException", (err) => {
  console.log(`Uncaught exception... Shutting down`);
  console.log(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: "./config.env" });
const app = require("./app");

//console.log(app.get("env"));

//console.log(process.env);

const DB = process.env.DATABASE.replace(
  "<PASSWORD>",
  process.env.DATABASE_PASSWORD
);

mongoose
  // .connect(process.env.LOCAL_DATABASE, {
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => {
    console.log("Database connection established!");
  });

// const testTour = new Tour({
//   name: "The Park Camper",
//   price: 997,
// });

// testTour
//   .save()
//   .then((doc) => console.log(doc))
//   .catch((err) => console.log(`Error` + err));

const port = process.env.PORT || 3000;
const server = app.listen(port, () => {
  console.log(`app running on the port ${port}`);
});

process.on("unhandledRejection", (err) => {
  console.log(`Unhandled rejection... Shutting down`);
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// console.log(x);
