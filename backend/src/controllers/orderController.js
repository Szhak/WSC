const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const createOrder = async (req, res, next) => {
  try {
    const { shippingAddress, phone, comment } = req.body;
    const userId = req.user.userId;

   
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { book: true }
    });

    if (!cartItems.length) {
      return res.status(400).json({ error: "Shopping cart is empty." });
    }

    const result = await prisma.$transaction(async (tx) => {
      let totalPrice = 0;
      const orderItemsData = [];

      for (const ci of cartItems) {
        const book = ci.book;

        if (!book) {
          throw new Error(`Book with ID ${ci.bookId} not found.`);
        }
        if (ci.quantity <= 0) {
          throw new Error(`Invalid quantity for book '${book.title}'.`);
        }
        if (book.stock < ci.quantity) {
          throw new Error(
            `Insufficient stock for book '${book.title}'. Remaining: ${book.stock}`
          );
        }

        totalPrice += book.price * ci.quantity;


        await tx.book.update({
          where: { id: ci.bookId },
          data: { stock: book.stock - ci.quantity }
        });

        orderItemsData.push({
          bookId: ci.bookId,
          quantity: ci.quantity,
          price: book.price
        });
      }

      const newOrder = await tx.order.create({
        data: {
          userId,
          totalPrice,
          status: "PAID",
          shippingAddress,
          phone,
          comment,
          items: { create: orderItemsData }
        },
        include: {
          items: { include: { book: true } }
        }
      });

    
      await tx.cartItem.deleteMany({ where: { userId } });

      return newOrder;
    });

    return res.status(201).json({ message: "Order placed successfully.", data: result });
  } catch (error) {
    return res.status(400).json({ error: error.message || "Failed to create order." });
  }
};



const getMyOrders = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        items: {
          include: { book: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ data: orders });
  } catch (error) {
    return next(error);
  }
};


const getOrderById = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid order id.' });
    }
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { book: true } }
      }
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    // Only admin can view
    if (req.user.role !== 'ADMIN' && order.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied.' });
    }
    return res.json({ data: order });
  } catch (error) {
    return next(error);
  }
};


const listAllOrders = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) {
      where.status = status;
    }
    const orders = await prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { book: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return res.json({ data: orders });
  } catch (error) {
    return next(error);
  }
};


const updateOrderStatus = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const { status: newStatus } = req.body;
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid order id.' });
    }
    if (!newStatus) {
      return res.status(400).json({ error: 'New status is required.' });
    }

    const allowedStatuses = ['PENDING', 'PAID', 'SHIPPED', 'CANCELLED'];
    if (!allowedStatuses.includes(newStatus)) {
      return res.status(400).json({ error: 'Invalid status value.' });
    }

    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });
    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (newStatus === 'CANCELLED' && order.status !== 'CANCELLED') {
      await prisma.$transaction(async (tx) => {
        for (const item of order.items) {
          await tx.book.update({
            where: { id: item.bookId },
            data: { stock: { increment: item.quantity } }
          });
        }
        await tx.order.update({ where: { id }, data: { status: newStatus } });
      });
    } else {
      await prisma.order.update({ where: { id }, data: { status: newStatus } });
    }

    return res.json({ message: 'Order status updated successfully.' });
  } catch (error) {
    return next(error);
  }
};

const cancelOrder = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id);
    const userId = req.user.userId;
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid order id.' });
    }
    const order = await prisma.order.findUnique({
      where: { id },
      include: { items: true }
    });
    if (!order || order.userId !== userId) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    if (!['PENDING', 'PAID'].includes(order.status)) {
      return res.status(400).json({ error: 'Cannot cancel an order that has been processed.' });
    }

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        await tx.book.update({
          where: { id: item.bookId },
          data: { stock: { increment: item.quantity } }
        });
      }
      await tx.order.update({ where: { id }, data: { status: 'CANCELLED' } });
    });

    return res.json({ message: 'Order cancelled and stock restored.' });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  getOrderById,
  listAllOrders,
  updateOrderStatus,
  cancelOrder
};