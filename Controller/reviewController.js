const Review = require("./../models/reviewModel");
const factory = require("./handleFactory");

exports.getAllReviews = factory.getAll(Review);

exports.setTourUserIds = (req, res, next) => {
  //Defining nested routes
  if (!req.body.tour) req.body.tour = req.params.tourId;
  if (!req.body.user) req.body.user = req.user.id;
  next();
};

exports.createReview = factory.createOne(Review);
exports.deleteReview = factory.deleteOne(Review);
exports.updateReview = factory.updateOne(Review);
exports.getReview = factory.getOne(Review, { path: "tour user" });
