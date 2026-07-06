#!/usr/bin/env node
import { migrateUp, migrateDown } from '../src/db/migrate.js';

const direction = process.argv[2] ?? 'up';

try {
  if (direction === 'up') {
    await migrateUp();
  } else if (direction === 'down') {
    await migrateDown();
  } else {
    console.error('Usage: node scripts/migrate.js [up|down]');
    process.exit(1);
  }
  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}
