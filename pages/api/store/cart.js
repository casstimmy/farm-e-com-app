import dbConnect from "@/lib/mongodb";
import mongoose from "mongoose";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import Inventory from "@/models/Inventory";
import Animal from "@/models/Animal";
import Service from "@/models/Service";
import { withCustomerAuth } from "@/utils/customerAuth";
import { withRateLimit } from "@/lib/rateLimit";

async function ensureUniqueSlug(baseSlug) {
  let slug = baseSlug;
  const exists = await Product.findOne({ slug }).select("_id").lean();
  if (!exists) return slug;
  slug = `${baseSlug}-${Date.now().toString(36)}`;
  return slug;
}

/**
 * Find or auto-create a Product for an inventory item.
 * This bridges the Inventory-based shop pages with the Product-based cart.
 */
async function getOrCreateProductForInventory(inventoryId) {
  // Check if a Product already exists for this inventory item
  let product = await Product.findOne({ inventoryItem: inventoryId });
  if (product) {
    if (!product.isActive) {
      product.isActive = true;
      await product.save();
    }
    return product;
  }

  // Fetch the inventory item
  const inv = await Inventory.findById(inventoryId);
  if (!inv || !inv.showOnSite || inv.quantity <= 0) return null;

  // Create slug from item name
  const baseSlug = (inv.item || "product")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = await ensureUniqueSlug(
    `${baseSlug}-${inv._id.toString().slice(-6)}`
  );

  // Auto-create a Product linked to this inventory item
  product = new Product({
    name: inv.item,
    slug,
    inventoryItem: inv._id,
    price: inv.salesPrice || inv.costPrice || 0,
    costPrice: inv.costPrice || 0,
    unit: inv.unit || "Unit",
    trackInventory: true,
    stockQuantity: inv.quantity,
    isActive: true,
    isFeatured: false,
  });

  try {
    await product.save();
    return product;
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await Product.findOne({
        inventoryItem: inventoryId,
        isActive: true,
      });
      if (existing) return existing;
    }
    throw error;
  }
}

async function getOrCreateProductForService(serviceId) {
  let product = await Product.findOne({ serviceRef: serviceId });
  if (product) {
    if (!product.isActive) {
      product.isActive = true;
      await product.save();
    }
    return product;
  }

  const service = await Service.findById(serviceId);
  if (!service || !service.showOnSite || !service.isActive) return null;

  const baseSlug = (service.name || "service")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = await ensureUniqueSlug(
    `${baseSlug}-${service._id.toString().slice(-6)}`
  );

  product = new Product({
    name: service.name,
    slug,
    productType: "service",
    serviceRef: service._id,
    description: service.description || "",
    price: service.price || 0,
    costPrice: 0,
    unit: service.unit || "Service",
    trackInventory: false,
    stockQuantity: 999999,
    isActive: true,
    isFeatured: false,
  });

  try {
    await product.save();
    return product;
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await Product.findOne({
        serviceRef: serviceId,
        isActive: true,
      });
      if (existing) return existing;
    }
    throw error;
  }
}

async function getOrCreateProductForAnimal(animalId) {
  let product = await Product.findOne({ animalRef: animalId });
  if (product) {
    if (!product.isActive) {
      product.isActive = true;
      await product.save();
    }
    return product;
  }

  const animal = await Animal.findById(animalId);
  if (
    !animal ||
    animal.status !== "Alive" ||
    animal.isArchived === true ||
    !animal.projectedSalesPrice ||
    animal.projectedSalesPrice <= 0
  ) {
    return null;
  }

  const baseName = animal.name || `${animal.species || "animal"}-${animal.tagId || "item"}`;
  const baseSlug = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = await ensureUniqueSlug(
    `${baseSlug}-${animal._id.toString().slice(-6)}`
  );

  product = new Product({
    name: baseName,
    slug,
    productType: "physical",
    animalRef: animal._id,
    description: animal.notes || "",
    price: animal.projectedSalesPrice,
    costPrice: 0,
    unit: "Animal",
    trackInventory: true,
    stockQuantity: 1,
    isActive: true,
    isFeatured: false,
    tags: ["animal", (animal.species || "").toLowerCase()].filter(Boolean),
    sku: `animal-${animal._id.toString()}`,
  });

  try {
    await product.save();
    return product;
  } catch (error) {
    if (error?.code === 11000) {
      const existing = await Product.findOne({
        animalRef: animalId,
        isActive: true,
      });
      if (existing) return existing;
    }
    throw error;
  }
}

/**
 * Customer cart endpoints.
 *
 * GET    /api/store/cart       — Get current cart with populated products
 * POST   /api/store/cart       — Add item to cart (accepts productId OR inventoryId)
 * PUT    /api/store/cart       — Update item quantity
 * DELETE /api/store/cart       — Remove item from cart
 */
async function handler(req, res) {
  await dbConnect();

  const customerId = req.customer.id;

  if (req.method === "GET") {
    try {
      let cart = await Cart.findOne({ customer: customerId }).populate({
        path: "items.product",
        select:
          "name slug price compareAtPrice images stockQuantity isActive trackInventory unit",
      });

      if (!cart) {
        return res.status(200).json({ items: [], itemCount: 0, subtotal: 0 });
      }

      const validItems = [];
      let modified = false;

      for (const item of cart.items) {
        if (!item.product || !item.product.isActive) {
          modified = true;
          continue;
        }

        if (item.price !== item.product.price) {
          item.price = item.product.price;
          modified = true;
        }

        if (
          item.product.trackInventory &&
          item.quantity > item.product.stockQuantity
        ) {
          if (item.product.stockQuantity <= 0) {
            modified = true;
            continue;
          }
          item.quantity = item.product.stockQuantity;
          modified = true;
        }

        validItems.push(item);
      }

      if (modified) {
        cart.items = validItems;
        cart.lastActivity = new Date();
        await cart.save();
        cart = await Cart.findById(cart._id).populate({
          path: "items.product",
          select:
            "name slug price compareAtPrice images stockQuantity isActive trackInventory unit",
        });
      }

      res.status(200).json({
        items: cart.items,
        itemCount: cart.itemCount,
        subtotal: cart.subtotal,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  } else if (req.method === "POST") {
    try {
      const { productId, inventoryId, serviceId, animalId, quantity = 1 } = req.body;

      if (!productId && !inventoryId && !serviceId && !animalId) {
        return res.status(400).json({
          error: "Provide one of productId, inventoryId, serviceId, or animalId",
        });
      }
      if (productId && !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ error: "Invalid productId" });
      }
      if (inventoryId && !mongoose.Types.ObjectId.isValid(inventoryId)) {
        return res.status(400).json({ error: "Invalid inventoryId" });
      }
      if (serviceId && !mongoose.Types.ObjectId.isValid(serviceId)) {
        return res.status(400).json({ error: "Invalid serviceId" });
      }
      if (animalId && !mongoose.Types.ObjectId.isValid(animalId)) {
        return res.status(400).json({ error: "Invalid animalId" });
      }

      let product;
      if (animalId) {
        product = await getOrCreateProductForAnimal(animalId);
        if (!product) {
          return res.status(404).json({ error: "Animal not available" });
        }
      } else if (serviceId) {
        product = await getOrCreateProductForService(serviceId);
        if (!product) {
          return res.status(404).json({ error: "Service not available" });
        }
      } else if (inventoryId) {
        // Auto-find or create a Product for this inventory item
        product = await getOrCreateProductForInventory(inventoryId);
        if (!product) {
          return res.status(404).json({ error: "Product not available" });
        }
        // Sync stock from inventory
        const inv = await Inventory.findById(inventoryId);
        if (inv) {
          product.stockQuantity = inv.quantity;
          product.price = inv.salesPrice || inv.costPrice || product.price;
          await product.save();
        }
      } else {
        product = await Product.findById(productId);
        if (!product || !product.isActive) {
          return res.status(404).json({ error: "Product not available" });
        }
      }

      const requestedQty = Math.max(1, parseInt(quantity, 10) || 1);

      if (product.trackInventory && product.stockQuantity < requestedQty) {
        return res.status(400).json({
          error:
            product.stockQuantity === 0
              ? "Product is out of stock"
              : `Only ${product.stockQuantity} available`,
        });
      }

      let cart = await Cart.findOne({ customer: customerId });

      if (!cart) {
        cart = new Cart({
          customer: customerId,
          items: [
            {
              product: product._id,
              quantity: requestedQty,
              price: product.price,
            },
          ],
        });
      } else {
        const productIdStr = product._id.toString();
        const existingItem = cart.items.find(
          (item) => item.product.toString() === productIdStr
        );

        if (existingItem) {
          const newQty = existingItem.quantity + requestedQty;
          if (product.trackInventory && newQty > product.stockQuantity) {
            return res.status(400).json({
              error: `Cannot add more. Only ${product.stockQuantity} available total.`,
            });
          }
          existingItem.quantity = newQty;
          existingItem.price = product.price;
        } else {
          cart.items.push({
            product: product._id,
            quantity: requestedQty,
            price: product.price,
          });
        }
      }

      cart.lastActivity = new Date();
      await cart.save();

      res.status(200).json({ message: "Item added to cart", itemCount: cart.itemCount });
    } catch (error) {
      console.error("Cart POST error:", error);
      res.status(500).json({ error: "Failed to update cart" });
    }
  } else if (req.method === "PUT") {
    try {
      const { itemId, quantity } = req.body;

      if (!itemId || quantity === undefined) {
        return res
          .status(400)
          .json({ error: "Item ID and quantity are required" });
      }

      const newQty = parseInt(quantity, 10);
      const cart = await Cart.findOne({ customer: customerId });

      if (!cart) {
        return res.status(404).json({ error: "Cart not found" });
      }

      const item = cart.items.id(itemId);
      if (!item) {
        return res.status(404).json({ error: "Item not found in cart" });
      }

      if (newQty <= 0) {
        cart.items.pull(itemId);
      } else {
        const product = await Product.findById(item.product);
        if (product?.trackInventory && newQty > product.stockQuantity) {
          return res.status(400).json({
            error: `Only ${product.stockQuantity} available`,
          });
        }
        item.quantity = newQty;
        if (product) item.price = product.price;
      }

      cart.lastActivity = new Date();
      await cart.save();

      res.status(200).json({ message: "Cart updated" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update cart" });
    }
  } else if (req.method === "DELETE") {
    try {
      const { itemId, clearAll } = req.body;

      if (clearAll) {
        await Cart.deleteOne({ customer: customerId });
        return res.status(200).json({ message: "Cart cleared" });
      }

      if (!itemId) {
        return res.status(400).json({ error: "Item ID is required" });
      }

      const cart = await Cart.findOne({ customer: customerId });
      if (!cart) {
        return res.status(404).json({ error: "Cart not found" });
      }

      cart.items.pull(itemId);
      cart.lastActivity = new Date();
      await cart.save();

      res.status(200).json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ error: "Failed to update cart" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}

export default withRateLimit(
  {
    keyPrefix: "store-cart",
    windowMs: 60 * 1000,
    max: 180,
  },
  withCustomerAuth(handler)
);
