const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/cart
const getCart = async (req, res, next) => {
  try {
    const userId = req.user.userId;

    const items = await prisma.cartItem.findMany({
      where: { userId },
      include: { book: true },
      orderBy: { id: "asc" },
    });

    res.json({ data: items });
  } catch (e) {
    next(e);
  }
};

// POST /api/cart/items  { bookId, quantity? }
const addCartItem = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const { bookId, quantity } = req.body;

    const bId = Number(bookId);
    const qty = Number(quantity || 1);

    if (!bId || qty <= 0) {
      return res.status(400).json({ error: "Invalid bookId or quantity" });
    }

    const item = await prisma.cartItem.upsert({
      where: { userId_bookId: { userId, bookId: bId } },
      update: { quantity: { increment: qty } },
      create: { userId, bookId: bId, quantity: qty },
    });

    res.json({ data: item });
  } catch (e) {
    next(e);
  }
};

// PATCH /api/cart/items/:bookId  { quantity }
const updateCartItemQty = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const bookId = Number(req.params.bookId);
    const qty = Number(req.body.quantity);

    if (!bookId || isNaN(qty)) {
      return res.status(400).json({ error: "Invalid input" });
    }

    if (qty <= 0) {
      await prisma.cartItem.delete({
        where: { userId_bookId: { userId, bookId } },
      });
      return res.json({ ok: true });
    }

    const item = await prisma.cartItem.update({
      where: { userId_bookId: { userId, bookId } },
      data: { quantity: qty },
    });

    res.json({ data: item });
  } catch (e) {
    next(e);
  }
};

// DELETE /api/cart/items/:bookId
const removeCartItem = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const bookId = Number(req.params.bookId);

    await prisma.cartItem.delete({
      where: { userId_bookId: { userId, bookId } },
    });

    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

// DELETE /api/cart
const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    await prisma.cartItem.deleteMany({ where: { userId } });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getCart,
  addCartItem,
  updateCartItemQty,
  removeCartItem,
  clearCart
};
