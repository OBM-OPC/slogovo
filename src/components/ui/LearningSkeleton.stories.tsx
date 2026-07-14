import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { CardSkeleton, ListSkeleton, Skeleton, TextSkeleton } from "./LearningSkeleton";

const meta = { title: "UI/Skeleton", component: Skeleton, tags: ["autodocs"], decorators: [(Story) => <div className="w-80"><Story /></div>] } satisfies Meta<typeof Skeleton>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Text: Story = { render: () => <TextSkeleton /> };
export const Card: Story = { render: () => <CardSkeleton /> };
export const List: Story = { render: () => <ListSkeleton /> };
