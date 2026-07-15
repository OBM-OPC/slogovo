import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { BookOpen } from "lucide-react";
import { Button } from "./Button";
import { EmptyState } from "./EmptyState";

const meta = { title: "UI/EmptyState", component: EmptyState, tags: ["autodocs"], args: { title: "Noch keine Wiederholungen", description: "Lerne deine erste Lektion. Danach erscheinen hier fällige Wörter.", illustration: <BookOpen className="h-9 w-9" />, action: <Button>Erste Lektion starten</Button> } } satisfies Meta<typeof EmptyState>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
