const { Router } = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/role");
const { placeOrder, getOrders, getOrder, cancelOrder } = require("../controllers/order.controller");
const { idParamRule, handleValidation } = require("../utils/validators");

const router = Router();

// All routes require authenticated CUSTOMER
router.use(authenticate, authorize("CUSTOMER"));

router.post("/", placeOrder);
router.get("/", getOrders);
router.get("/:id", idParamRule, handleValidation, getOrder);
router.patch("/:id/cancel", idParamRule, handleValidation, cancelOrder);

module.exports = router;
