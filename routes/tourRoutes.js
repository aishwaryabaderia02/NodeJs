const express = require("express");
const tourController = require("./.././Controller/tourController");
const authController = require("../Controller/authController");
const reviewRouter = require("./reviewRoutes");

const router = express.Router();

//1 POST/tour/234dfg/reviews
//2 GET/tours/234gdf/reviews
//3 GET/tours/234gdf/reviews/5553sf

// router
//   .route("/:tourId/reviews")
//   .post(
//     authController.protect,
//     authController.restrictTo("user"),
//     reviewController.createReviews
//   );

router.use("/:tourId/reviews", reviewRouter);

//router.param("id", tourController.checkId);

router
  .route("/monthly-plan/:year")
  .get(
    authController.protect,
    authController.restrictTo("admin", "lead-guide", "guide"),
    tourController.getMonthyPlan
  );

router.route("/tour-stats").get(tourController.getTourStats);

router
  .route("/top-5-cheap")
  .get(tourController.aliasTopTours, tourController.getAllTours);

router
  .route("/")
  .get(tourController.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.createTour
  );
router
  .route("/:id")
  .get(tourController.getTour)
  .patch(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.updateTour
  )
  .delete(
    authController.protect,
    authController.restrictTo("admin", "lead-guide"),
    tourController.deleteTour
  );

module.exports = router;
