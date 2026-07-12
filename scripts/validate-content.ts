import { getAllModules, getLessonsByModule } from "@/lib/content";
import { reportIssues, validateModules } from "@/lib/content-validation";

function main() {
  const modules = getAllModules();
  const lessons = modules.flatMap((m) => getLessonsByModule(m.moduleId));
  const issues = validateModules(modules, lessons);
  const { errors, warnings, text } = reportIssues(issues);

  if (text) {
    // eslint-disable-next-line no-console
    console.log(text);
  }
  // eslint-disable-next-line no-console
  console.log(`\nValidation complete: ${errors} error(s), ${warnings} warning(s).`);
  process.exit(errors > 0 ? 1 : 0);
}

main();
