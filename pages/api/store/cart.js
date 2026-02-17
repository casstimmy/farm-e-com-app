import dbConnect from "@/lib/mongodb";
import Cart from "@/models/Cart";
import Product from "@/models/Product";
import { withCustomerAuth } from "@/utils/customerAuth";

/**
 * Customer cart endpoints.
 *
 * GET    /api/store/cart       — Get current cart with populated products
 * POST   /api/store/cart       — Add item to cart
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
      const { productId, quantity = 1 } = req.body;

      if (!productId) {
        return res.status(400).json({ error: "Product ID is required" });
      }

      const product = await Product.findById(productId);
      if (!product || !product.isActive) {
        return res.status(404).json({ error: "Product not available" });
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
        const existingItem = cart.items.find(
          (item) => item.product.toString() === productId
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

export default withCustomerAuth(handler);
