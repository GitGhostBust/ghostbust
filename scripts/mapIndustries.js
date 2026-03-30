// Backfills the `industry` column on ghost_scans rows where it is null or empty.
// Run with: node scripts/mapIndustries.js
//
// Required env vars:
//   SUPABASE_URL          — your Supabase project URL
//   SUPABASE_SERVICE_KEY  — service role key (full access)

import { createClient } from "@supabase/supabase-js";
import { mapIndustry } from "./helpers/mapIndustry.js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "Missing env vars. Set SUPABASE_URL and SUPABASE_SERVICE_KEY."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const BATCH_SIZE = 100;

async function main() {
  console.log("\n  GhostBust — Industry Backfill\n");

  let offset = 0;
  let totalUpdated = 0;
  let totalOther = 0;
  let totalRows = 0;

  while (true) {
    // Fetch rows where industry is null or empty string
    const { data: rows, error } = await supabase
      .from("ghost_scans")
      .select("id, title")
      .eq("industry", "Other")
      .not("title", "is", null)
      .range(offset, offset + BATCH_SIZE - 1);

    if (error) {
      console.error("  x Failed to fetch rows:", error.message);
      process.exit(1);
    }

    if (!rows || rows.length === 0) break;

    totalRows += rows.length;
    console.log(
      `  Batch starting at offset ${offset}: ${rows.length} rows to update`
    );

    for (const row of rows) {
      const industry = mapIndustry(row.title);
      if (industry === "Other") totalOther++;

      const { error: updateError } = await supabase
        .from("ghost_scans")
        .update({ industry })
        .eq("id", row.id);

      if (updateError) {
        console.error(
          `  x Failed to update id=${row.id} ("${row.title}"): ${updateError.message}`
        );
      } else {
        totalUpdated++;
      }
    }

    offset += BATCH_SIZE;

    // If we got fewer rows than batch size, we've reached the end
    if (rows.length < BATCH_SIZE) break;
  }

  console.log(`\n  Done.`);
  console.log(`  Rows processed : ${totalRows}`);
  console.log(`  Rows updated   : ${totalUpdated}`);
  console.log(`  Fell into Other: ${totalOther}`);
  console.log();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
