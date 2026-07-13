import { getAllGrammarTopics, getAllModules, getLessonsByModule } from "@/lib/content";
import { buildContentQualityReport, renderContentQualityReport } from "@/lib/content-quality";
import { loadContentInventory, validateRegistryDrift } from "@/lib/content-inventory";
import { reportIssues, validateGrammarTopics, validateModules } from "@/lib/content-validation";

async function main() {
  const registeredModules = getAllModules();
  const registeredLessons = registeredModules.flatMap((module) => getLessonsByModule(module.moduleId));
  const registeredGrammarTopics = getAllGrammarTopics();
  const inventory = await loadContentInventory();
  const filesystemModules = inventory.modules.map(({ data }) => data);
  const filesystemLessons = inventory.lessons.map(({ data }) => data);
  const issues = [
    ...inventory.issues,
    ...validateRegistryDrift(inventory, registeredModules, registeredLessons),
    ...validateModules(filesystemModules, filesystemLessons),
    ...validateGrammarTopics(registeredGrammarTopics),
  ];
  const { errors, warnings, text } = reportIssues(issues);
  const qualityReport = buildContentQualityReport(filesystemModules, filesystemLessons);

  if (text) {
    // eslint-disable-next-line no-console
    console.log(text);
  }
  // eslint-disable-next-line no-console
  console.log(
    `\nValidated ${inventory.modules.length} module file(s), ${inventory.lessons.length} lesson file(s), and ${registeredGrammarTopics.length} grammar topic(s): ${errors} error(s), ${warnings} warning(s).`,
  );
  // eslint-disable-next-line no-console
  console.log(`\n${renderContentQualityReport(qualityReport)}`);
  process.exit(errors > 0 ? 1 : 0);
}

void main().catch((error: unknown) => {
  // eslint-disable-next-line no-console
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
