const prisma = require("../config/db");

async function listProducts(req, res) {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
    });
    return res.json(products);
  } catch (err) {
    console.error("List products error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function getProduct(req, res) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: parseInt(req.params.id) },
    });
    if (!product) {
      return res.status(404).json({ error: "Product not found." });
    }
    return res.json(product);
  } catch (err) {
    console.error("Get product error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function createProduct(req, res) {
  try {
    const { name, description, price, stock } = req.body;
    const product = await prisma.product.create({
      data: { name, description, price, stock },
    });
    return res.status(201).json(product);
  } catch (err) {
    console.error("Create product error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function updateProduct(req, res) {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Product not found." });
    }

    const { name, description, price, stock } = req.body;
    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price }),
        ...(stock !== undefined && { stock }),
      },
    });
    return res.json(product);
  } catch (err) {
    console.error("Update product error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

async function deleteProduct(req, res) {
  try {
    const id = parseInt(req.params.id);

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: "Product not found." });
    }

    await prisma.product.delete({ where: { id } });
    return res.json({ message: "Product deleted successfully." });
  } catch (err) {
    console.error("Delete product error:", err);
    return res.status(500).json({ error: "Internal server error." });
  }
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, deleteProduct };
