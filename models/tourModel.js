const mongoose = require("mongoose");
const slugify = require("slugify");
const validator = require("validator");

// const User = require("./userModel");

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "A tour must have a name"],
      trim: true,
      unique: true,
      maxlength: [40, `A tour can have altmost 40 characters`],
      minlength: [10, `A tour can have altmost 10 characters`],
      //validate: [validator.isAlpha, "Only characters are allowed"],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, "A tour must have a duration."],
    },
    maxGroupSize: {
      type: Number,
      required: [true, "A tour must have a group Size."],
    },
    difficulty: {
      type: String,
      required: [true, "A tour must have a diffculty."],
      enum: {
        values: ["easy", "medium", "difficult"],
        message: "Difficulty is either easy,medium or difficult",
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, `Rating must be above 1.0`],
      max: [5, `Rating must be below 5.0`],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "A tour must have a price"],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          //This only has access to document being created therefore won't work on update
          return val < this.price;
        },
        message: `Discount price {{VALUE}} should be less than regular price`,
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, "A tour must have a descrition"],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, "A tour must have a image"],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      //For recognizing geospatial data we need two fields type and coordinate
      type: {
        type: String,
        default: "Point",
        enum: ["Point"],
      },
      //Coordinate follows longitude latitude
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: "Point",
          enum: ["Point"],
        },
        //Coordinate follows longitude latitude
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });

tourSchema.virtual("durationWeeks").get(function () {
  return this.duration / 7;
});

tourSchema.virtual("reviews", {
  ref: "Review",
  foreignField: "tour",
  localField: "_id",
});

//DOCUMENT MIDDLEWARE : runes before .save command and .create command. It will not work for insertMany or FindOneAndUpdate
tourSchema.pre("save", function (next) {
  try {
    this.slug = slugify(this.name, { lower: true });
    next();
  } catch (err) {
    console.log(err.message);
  }
});

//CODE FOR EMBEDDING GUIDES IN TOUR WHICH WE DO NOT WANT
// tourSchema.pre("save", async function (next) {
//   const guidesPromises = this.guides.map(async (id) => await User.findById(id));

//   this.guides = await Promise.all(guidesPromises);
//   next();
// });

// tourSchema.pre("save", function (next) {
//   console.log("Will save document..!!!");
//   next();
// });

// tourSchema.post("save", function (doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARE
// tourSchema.pre("find", function (next) {
tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  this.start = Date.now();
  next();
});

tourSchema.pre(/^find/, function () {
  this.populate({
    path: "guides",
    select: "-__v --passwordChangedAt",
  });
});

tourSchema.post(/^find/, function (docs, next) {
  //console.log(docs);
  console.log(`This query took ${Date.now() - this.start} miliseconds`);
  next();
});

//Aggregation Middleware
tourSchema.pre("aggregate", function (next) {
  this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
  console.log(this);
  next();
});

const Tour = mongoose.model("Tour", tourSchema);

module.exports = Tour;
