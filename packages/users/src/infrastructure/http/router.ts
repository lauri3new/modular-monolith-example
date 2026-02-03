import { Router } from "express";
import type { DatabaseConnection } from "@acme/db";

export interface UsersRouterDependencies {
  db: DatabaseConnection;
}

export function createUsersRouter(_deps: UsersRouterDependencies): Router {
  const router = Router();

  router.get("/me", (_req, res) => {
    res.json({ message: "Users routes - implement based on your needs" });
  });

  return router;
}
