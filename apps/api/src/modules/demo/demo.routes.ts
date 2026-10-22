import { Router } from "express";
import { Order } from "../../models/Order";
import { authenticate, requireRole } from "../../middleware/auth";
import { AppError } from "../../utils/AppError";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();
router.use(authenticate);

const day = (n: number) => new Date(Date.now() + n * 86_400_000);

// Dev-only helper so you can try the order-lookup tool without a real OMS.
router.post("/seed-orders", requireRole("owner", "admin"), asyncHandler(async (req, res) => {
  if (process.env.NODE_ENV === "production") throw new AppError(404, "Not found");
  const tenantId = req.auth!.tenantId;
  const orders = [
    { orderNumber: "ORD-1001", customerEmail: "ava@example.com", status: "shipped", total: 129.99,
      items: [{ name: "Wireless Headphones", qty: 1, price: 129.99 }], trackingNumber: "TRK-88231", estimatedDelivery: day(2) },
    { orderNumber: "ORD-1002", customerEmail: "sam@example.com", status: "processing", total: 54.5,
      items: [{ name: "Phone Case", qty: 2, price: 19.5 }, { name: "Screen Protector", qty: 1, price: 15.5 }], estimatedDelivery: day(5) },
    { orderNumber: "ORD-1003", customerEmail: "li@example.com", status: "delivered", total: 349,
      items: [{ name: "Standing Desk", qty: 1, price: 349 }], trackingNumber: "TRK-77410", estimatedDelivery: day(-3) },
  ];
  await Order.bulkWrite(
    orders.map((o) => ({
      updateOne: { filter: { tenantId, orderNumber: o.orderNumber }, update: { $set: { ...o, tenantId } }, upsert: true },
    }))
  );
  res.json({ seeded: orders.map((o) => o.orderNumber) });
}));

export default router;
