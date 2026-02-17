const { Router } = require("express");
const authenticate = require("../middleware/auth");
const authorize = require("../middleware/role");
const {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
} = require("../controllers/product.controller");
const {
  createProductRules,
  updateProductRules,
  idParamRule,
  handleValidation,
} = require("../utils/validators");

const router = Router();

// Public
router.get("/", listProducts);
router.get("/:id", idParamRule, handleValidation, getProduct);

// Admin only
router.post("/", authenticate, authorize("ADMIN"), createProductRules, handleValidation, createProduct);
router.put("/:id", authenticate, authorize("ADMIN"), idParamRule, updateProductRules, handleValidation, updateProduct);
router.delete("/:id", authenticate, authorize("ADMIN"), idParamRule, handleValidation, deleteProduct);

module.exports = router;
