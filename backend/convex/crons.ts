import { cronJobs } from "convex/server";

import { internal } from "./_generated/api";

const crons = cronJobs();

// Runs every day; sendScheduledExports selects the Customers whose
// Export Schedule day matches today and sends the previous Collection Month.
crons.daily(
  "send-scheduled-exports",
  { hourUTC: 7, minuteUTC: 0 },
  internal.exports.sendScheduledExports
);

export default crons;
