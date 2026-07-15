import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./Button";
import { ToastProvider, useToast } from "./Toast";

const meta = { title: "UI/Toast", component: ToastProvider, tags: ["autodocs"], args: { children: null } } satisfies Meta<typeof ToastProvider>;
export default meta;
type Story = StoryObj<typeof meta>;

function ToastDemo({ persistent = false, withAction = false }: { persistent?: boolean; withAction?: boolean }) {
  const { toast } = useToast();
  return <Button onClick={() => toast({ title: "Fortschritt gespeichert", description: "Deine Änderungen sind auf allen Geräten verfügbar.", tone: "success", duration: persistent ? null : 4500, action: withAction ? { label: "Rückgängig", onClick: () => undefined } : undefined })}>Meldung anzeigen</Button>;
}
export const AutoDismiss: Story = { render: () => <ToastProvider><ToastDemo /></ToastProvider> };
export const WithAction: Story = { render: () => <ToastProvider><ToastDemo withAction /></ToastProvider> };
export const Persistent: Story = { render: () => <ToastProvider><ToastDemo persistent /></ToastProvider> };
