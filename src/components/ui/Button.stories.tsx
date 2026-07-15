import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./Button";

const meta = { title: "UI/Button", component: Button, args: { children: "Weiter" }, tags: ["autodocs"] } satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Primary: Story = {};
export const Secondary: Story = { args: { variant: "secondary" } };
export const Ghost: Story = { args: { variant: "ghost" } };
export const Danger: Story = { args: { variant: "danger", children: "Konto löschen" } };
export const Link: Story = { args: { variant: "link", children: "Mehr erfahren" } };
export const Loading: Story = { args: { isLoading: true, children: "Wird gespeichert" } };
