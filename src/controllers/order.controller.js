const prisma = require("../config/db");
const { Prisma } = require("@prisma/client");
const Decimal = Prisma.Decimal;

const MAX_CANCELLATIONS = 5;

async function placeOrder(req, res) {
  try {
    // Check cancellation count
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (user.cancellationCount >= MAX_CANCELLATIONS) {
      return res.status(403).json({
        error: "Too many cancellations. You are blocked from placing new orders.",
      });
    }

    const cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty." });
    }

    // Transactional checkout
    const order = await prisma.$transaction(async (tx) => {
      // Re-validate stock inside the transaction
      let totalAmount = new Decimal(0);
      const orderItemsData = [];

      for (const item of cart.items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product "${item.product.name}" no longer exists.`);
        }
        if (product.stock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}". Requested: ${item.quantity}, Available: ${product.stock}.`
          );
        }

        const lineTotal = new Decimal(product.price.toString()).mul(item.quantity);
        totalAmount = totalAmount.add(lineTotal);

        orderItemsData.push({
          productId: product.id,
          quantity: item.quantity,
          priceAtPurchase: product.price,
        });

        // Deduct stock
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        });
      }

      // Create order with items
      const newOrder = await tx.order.create({
        data: {
          userId: req.user.id,
          totalAmount,
          items: { create: orderItemsData },
        },
        include: { items: { include: { product: { select: { id: true, name: true } } } } },
      });

      // Clear cart
      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    return res.status(201).json({ message: "Order placed successfully.", order });
  } catch (err) {
    // Transaction rollback errors surface here
    if (err.message.includes("Insufficient stock") || err.message.includes("no longer exists")) {
      return res.status(400).json({ error: err.message });
    }
    console.error("Place order error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function getOrders(req, res) {
  try {
    const orders = await prisma.order.findMany({
      where: { userId: req.user.id },
      include: {
        items: {
          include: { product: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return res.json(orders);
  } catch (err) {
    console.error("Get orders error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function getOrder(req, res) {
  try {
    const id = parseInt(req.params.id);
    const order = await prisma.order.findFirst({
      where: { id, userId: req.user.id },
      include: {
        items: {
          include: { product: { select: { id: true, name: true } } },
        },
      },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }

    return res.json(order);
  } catch (err) {
    console.error("Get order error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function cancelOrder(req, res) {
  try {
    const id = parseInt(req.params.id);
    const order = await prisma.order.findFirst({
      where: { id, userId: req.user.id },
      include: { items: true },
    });

    if (!order) {
      return res.status(404).json({ error: "Order not found." });
    }
    if (order.status !== "PENDING") {
      return res.status(400).json({ error: "Only pending orders can be cancelled." });
    }

    await prisma.$transaction(async (tx) => {
      // Restore stock
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      // Mark order as cancelled
      await tx.order.update({
        where: { id },
        data: { status: "CANCELLED" },
      });

      // Increment cancellation count
      await tx.user.update({
        where: { id: req.user.id },
        data: { cancellationCount: { increment: 1 } },
      });
    });

    return res.json({ message: "Order cancelled successfully." });
  } catch (err) {
    console.error("Cancel order error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { placeOrder, getOrders, getOrder, cancelOrder };
