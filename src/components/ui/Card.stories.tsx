import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Card, CardDescription, CardHeader, CardTitle } from "./Card";

const meta = { title: "UI/Card", component: Card, tags: ["autodocs"], args: { children: <><CardHeader><CardTitle>Heute lernen</CardTitle><CardDescription>Deine nächste Lerneinheit dauert etwa 8 Minuten.</CardDescription></CardHeader></> } } satisfies Meta<typeof Card>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const Interactive: Story = { args: { variant: "interactive" } };
export const Highlighted: Story = { args: { variant: "highlighted" } };
