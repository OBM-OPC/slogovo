import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Button } from "./Button";
import { Dialog } from "./Dialog";

const meta = { title: "UI/Dialog", component: Dialog, tags: ["autodocs"], args: { open: false, onOpenChange: () => undefined, title: "Dialog" } } satisfies Meta<typeof Dialog>;
export default meta;
type Story = StoryObj<typeof meta>;

function DialogDemo({ variant = "modal" }: { variant?: "modal" | "alert" | "confirm" }) {
  const [open, setOpen] = useState(false);
  return <><Button onClick={() => setOpen(true)}>Dialog öffnen</Button><Dialog open={open} onOpenChange={setOpen} variant={variant} title={variant === "alert" ? "Lerndaten löschen?" : "Tagesziel anpassen"} description="Diese Aktion kann jederzeit erneut geändert werden." footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Abbrechen</Button><Button variant={variant === "alert" ? "danger" : "primary"} onClick={() => setOpen(false)}>Bestätigen</Button></>}><p className="text-sm text-muted">Dialoginhalt mit Fokusfalle, Escape-Schließen und Overlay-Schließen.</p></Dialog></>;
}
export const Modal: Story = { render: () => <DialogDemo /> };
export const Alert: Story = { render: () => <DialogDemo variant="alert" /> };
export const Confirm: Story = { render: () => <DialogDemo variant="confirm" /> };
