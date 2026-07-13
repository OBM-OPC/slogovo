import { loadContentInventory } from "@/lib/content-inventory";
import { buildContentQualityReport, renderContentQualityReport } from "@/lib/content-quality";

async function main() {
  const inventory = await loadContentInventory();
  const report = buildContentQualityReport(
    inventory.modules.map(({ data }) => data),
    inventory.lessons.map(({ data }) => data)
  );
  // eslint-disable-next-line no-console
  console.log(renderContentQualityReport(report));
}

void main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
