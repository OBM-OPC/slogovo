import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CircularProgress, ProgressBar } from "./ProgressBar";

const meta = { title: "UI/Progress", component: ProgressBar, tags: ["autodocs"], decorators: [(Story) => <div className="w-80"><Story /></div>], args: { value: 64, ariaLabel: "Kapitel-Fortschritt" } } satisfies Meta<typeof ProgressBar>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Linear: Story = {};
export const Circular: Story = { render: () => <CircularProgress value={64} /> };
export const CircularWithLabel: Story = { render: () => <CircularProgress value={3} max={5} label="3/5" /> };
