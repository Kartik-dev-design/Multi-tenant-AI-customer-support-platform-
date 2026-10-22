import { Router } from "express";
import { Ticket } from "../../models/Ticket";
import { authenticate } from "../../middleware/auth";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();
router.use(authenticate);

router.get("/", asyncHandler(async (req, res) => {
  const tickets = await Ticket.find({ tenantId: req.auth!.tenantId }).sort({ createdAt: -1 }).limit(50);
  res.json({
    tickets: tickets.map((t) => ({
      id: t.id, subject: t.subject, description: t.description, priority: t.priority,
      status: t.status, createdVia: t.createdVia, createdAt: t.createdAt,
    })),
  });
}));

export default router;
