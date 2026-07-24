import { Router } from "express";
import {
  getUsers,
  updateUserRole,
} from "../../controllers/admin-controller/user-controller";
import authenticate, {
  authorizeRoles,
} from "../../middleware/auth-middleware";

const router = Router();

router.use(authenticate, authorizeRoles("admin"));
router.get("/", getUsers);
router.patch("/:id/role", updateUserRole);

export default router;
