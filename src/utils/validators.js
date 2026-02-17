const { body, param } = require("express-validator");
const { validationResult } = require("express-validator");

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

const registerRules = [
  body("name").trim().notEmpty().withMessage("Name is required."),
  body("email").isEmail().withMessage("Valid email is required."),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters."),
];

const loginRules = [
  body("email").isEmail().withMessage("Valid email is required."),
  body("password").notEmpty().withMessage("Password is required."),
];

const createProductRules = [
  body("name").trim().notEmpty().withMessage("Product name is required."),
  body("price")
    .isFloat({ gt: 0 })
    .withMessage("Price must be a positive number."),
  body("stock")
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer."),
  body("description").optional().trim(),
];

const updateProductRules = [
  body("name").optional().trim().notEmpty().withMessage("Name cannot be empty."),
  body("price")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("Price must be a positive number."),
  body("stock")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Stock must be a non-negative integer."),
  body("description").optional().trim(),
];

const addCartItemRules = [
  body("productId").isInt({ gt: 0 }).withMessage("Valid product ID is required."),
  body("quantity")
    .isInt({ gt: 0 })
    .withMessage("Quantity must be a positive integer."),
];

const updateCartItemRules = [
  body("quantity")
    .isInt({ gt: 0 })
    .withMessage("Quantity must be a positive integer."),
];

const idParamRule = [
  param("id").isInt({ gt: 0 }).withMessage("Valid ID is required."),
];

const itemIdParamRule = [
  param("itemId").isInt({ gt: 0 }).withMessage("Valid item ID is required."),
];

module.exports = {
  handleValidation,
  registerRules,
  loginRules,
  createProductRules,
  updateProductRules,
  addCartItemRules,
  updateCartItemRules,
  idParamRule,
  itemIdParamRule,
};
