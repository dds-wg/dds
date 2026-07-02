#!/usr/bin/env tsx
import { runMigrations } from "./client.js";

await runMigrations();
console.log("migrations applied");
