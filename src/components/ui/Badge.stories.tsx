import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Badge } from "./Badge";

const meta = { title: "UI/Badge", component: Badge, tags: ["autodocs"], args: { children: "A1" } } satisfies Meta<typeof Badge>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Primary: Story = { args: { tone: "primary" } };
export const Success: Story = { args: { tone: "success", children: "Gemeistert" } };
export const Warning: Story = { args: { tone: "warning", children: "Heute fällig" } };
export const Danger: Story = { args: { tone: "danger", children: "Wiederholen" } };
