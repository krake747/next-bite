import { cronJobs } from "convex/server"

import { internal } from "./_generated/api"

const crons = cronJobs()

crons.daily("delete unclaimed uploads", { hourUTC: 3, minuteUTC: 0 }, internal.storage.cleanupUnclaimed, {
    cursor: null,
})

export default crons
