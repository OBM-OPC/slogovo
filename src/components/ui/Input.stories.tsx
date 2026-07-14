import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Input } from "./Input";

const meta = { title: "UI/Input", component: Input, tags: ["autodocs"], args: { id: "email", label: "E-Mail", placeholder: "deine@email.de" } } satisfies Meta<typeof Input>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const WithHint: Story = { args: { hint: "Wir senden dir Lernhinweise, wenn du sie aktivierst." } };
export const Error: Story = { args: { error: "Bitte gib eine gültige E-Mail-Adresse ein." } };
export const Disabled: Story = { args: { disabled: true, value: "mila@example.com" } };
export const Loading: Story = { args: { isLoading: true, value: "Wird geprüft" } };
