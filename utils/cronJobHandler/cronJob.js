import Query from "../../models/Query.js";
import cron from 'node-cron';


cron.schedule("*/1 * * * *", async () => {
    console.log("Checking for expired queries...");

    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    const result = await Query.updateMany(
        { createdAt: { $lte: fiveMinutesAgo }, status: "waiting" },
        { $set: { status: "expired" } }
    );
    console.log(`Expired queries updated: ${result.modifiedCount}`);
});