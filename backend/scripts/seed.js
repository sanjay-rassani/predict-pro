#!/usr/bin/env node
import { seedAll } from '../src/db/seed.js';

try {
  await seedAll();
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
