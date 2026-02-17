const { Router } = require("express");
const { register, login } = require("../controllers/auth.controller");
const { registerRules, loginRules, handleValidation } = require("../utils/validators");

const router = Router();

router.post("/register", registerRules, handleValidation, register);
router.post("/login", loginRules, handleValidation, login);

module.exports = router;
