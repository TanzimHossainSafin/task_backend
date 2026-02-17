const { Router } = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/role");
const { getCart, addItem, updateItem, removeItem } = require("../controllers/cart.controller");
const {
  addCartItemRules,
  updateCartItemRules,
  itemIdParamRule,
  handleValidation,
} = require("../utils/validators");

const router = Router();

// All routes require authenticated CUSTOMER
router.use(authenticate, authorize("CUSTOMER"));

router.get("/", getCart);
router.post("/items", addCartItemRules, handleValidation, addItem);
router.put("/items/:itemId", itemIdParamRule, updateCartItemRules, handleValidation, updateItem);
router.delete("/items/:itemId", itemIdParamRule, handleValidation, removeItem);

module.exports = router;
