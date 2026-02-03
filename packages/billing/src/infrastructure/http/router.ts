import { Router } from "express";
import type { DatabaseConnection } from "@acme/db";

export interface BillingRouterDependencies {
  db: DatabaseConnection;
}

export function createBillingRouter(_deps: BillingRouterDependencies): Router {
  const router = Router();

  router.get("/subscription", (_req, res) => {
    res.json({ message: "Billing routes - implement based on your needs" });
  });

  return router;
}
