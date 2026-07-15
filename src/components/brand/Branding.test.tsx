import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import manifest from "@/app/manifest";
import { BrandGlyph, BrandLogo } from "./BrandMark";
import { AchievementIllustration, EmptyLearningIllustration, OnboardingIllustration } from "./Illustrations";

describe("Slogovo branding", () => {
  it("uses one accessible logo mark and decorative product illustrations", () => {
    const { container } = render(<><BrandGlyph /><BrandLogo /><EmptyLearningIllustration /><AchievementIllustration /><OnboardingIllustration /></>);
    expect(screen.getByRole("img", { name: "Slogovo" })).toBeTruthy();
    expect(screen.getByRole("link", { name: "Slogovo Startseite" }).getAttribute("href")).toBe("/");
    expect(container.querySelectorAll('svg[aria-hidden="true"]').length).toBeGreaterThanOrEqual(4);
  });

  it("publishes consistent PWA identity colors and icon", () => {
    const data = manifest();
    expect(data.short_name).toBe("Slogovo");
    expect(data.theme_color).toBe("#2D6A4F");
    expect(data.background_color).toBe("#FAF8F5");
    expect(data.icons?.[0]?.src).toBe("/icon.svg");
  });
});
