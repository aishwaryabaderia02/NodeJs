const express = require("express");
const userController = require("../Controller/userController");
const authController = require("../Controller/authController");

const router = express.Router();

router.route("/signup").post(authController.signup);
router.route("/login").post(authController.login);
router.route("/forgotpassword").post(authController.forgotPassword);
router.route("/resetpassword/:token").patch(authController.resetPassword);

//Protect all routes after this middleware
router.use(authController.protect);

router.route("/me").get(userController.getMe, userController.getUser);
router.route("/updatepassword").patch(authController.updatePassword);
router.route("/updateMe").patch(userController.updateMe);
router.route("/deleteMe").delete(userController.deleteMe);

router.use(authController.restrictTo("admin"));

router.route("/").get(userController.getAllUsers);

router
  .route("/:id")
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
