const express = require("express");
const router = express.Router();
const authenticateToken = require("../middlewares/authMiddleware");

const {
  getCart,
  addCartItem,
  updateCartItemQty,
  removeCartItem,
  clearCart
} = require("../controllers/cartController");

router.use(authenticateToken);

router.get("/", getCart);
router.post("/items", addCartItem);
router.patch("/items/:bookId", updateCartItemQty);
router.delete("/items/:bookId", removeCartItem);
router.delete("/", clearCart);

module.exports = router;
