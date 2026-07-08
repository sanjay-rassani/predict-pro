#!/usr/bin/env node
import { seedDemoData } from '../src/db/demoData.js';

try {
  await seedDemoData();
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
