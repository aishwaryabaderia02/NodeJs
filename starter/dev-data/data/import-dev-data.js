const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../../models/tourModel');
const User = require('./../../../models/userModel');
const Review = require('./../../../models/reviewModel');
dotenv.config({ path: './../../../config.env' });

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
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
    console.log('Database connection established!');
  });

//Read Json File
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const reviews = JSON.parse(
  fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
);

//IMPORT DATA INTO DATABASE
const importData = async function () {
  try {
    await User.create(users, { validateBeforeSave: false });
    console.log('Data Successfully Loaded');
  } catch (err) {
    console.log(err);
  }
  process.exit();
};

//Delete Data from db
const deleteData = async function () {
  await User.deleteMany();
  console.log('Data succesfully deleted');
  process.exit();
};

console.log(process.argv);

if (process.argv[2] == '--import') {
  importData();
}

if (process.argv[2] == '--delete') {
  deleteData();
}
