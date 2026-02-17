const prisma = require("../config/db");

async function getCart(req, res) {
  try {
    let cart = await prisma.cart.findUnique({
      where: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, price: true, stock: true } },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: { userId: req.user.id },
        include: { items: { include: { product: true } } },
      });
    }

    return res.json(cart);
  } catch (err) {
    console.error("Get cart error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function addItem(req, res) {
  try {
    const { productId, quantity } = req.body;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }
    if (product.stock < quantity) {
      return res
        .status(400)
        .json({ error: `Insufficient stock. Only ${product.stock} available.` });
    }

    // Ensure cart exists
    let cart = await prisma.cart.findUnique({ where: { userId: req.user.id } });
    if (!cart) {
      cart = await prisma.cart.create({ data: { userId: req.user.id } });
    }

    // Upsert cart item
    const existingItem = await prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId: cart.id, productId } },
    });

    let cartItem;
    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      if (product.stock < newQty) {
        return res
          .status(400)
          .json({ error: `Insufficient stock. Only ${product.stock} available.` });
      }
      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQty },
        include: { product: { select: { id: true, name: true, price: true } } },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: { cartId: cart.id, productId, quantity },
        include: { product: { select: { id: true, name: true, price: true } } },
      });
    }

    return res.status(201).json(cartItem);
  } catch (err) {
    console.error("Add item error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function updateItem(req, res) {
  try {
    const itemId = parseInt(req.params.itemId);
    const { quantity } = req.body;

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true, product: true },
    });

    if (!cartItem || cartItem.cart.userId !== req.user.id) {
      return res.status(404).json({ error: "Cart item not found." });
    }

    if (cartItem.product.stock < quantity) {
      return res
        .status(400)
        .json({ error: `Insufficient stock. Only ${cartItem.product.stock} available.` });
    }

    const updated = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: { select: { id: true, name: true, price: true } } },
    });

    return res.json(updated);
  } catch (err) {
    console.error("Update item error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function removeItem(req, res) {
  try {
    const itemId = parseInt(req.params.itemId);

    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem || cartItem.cart.userId !== req.user.id) {
      return res.status(404).json({ error: "Cart item not found." });
    }

    await prisma.cartItem.delete({ where: { id: itemId } });
    return res.json({ message: "Item removed from cart." });
  } catch (err) {
    console.error("Remove item error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { getCart, addItem, updateItem, removeItem };
