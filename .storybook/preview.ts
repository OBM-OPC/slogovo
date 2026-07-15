import type { Preview } from "@storybook/nextjs-vite";
import "../src/app/globals.css";

const preview: Preview = {
  parameters: {
    a11y: { test: "error" },
    layout: "centered",
    backgrounds: {
      default: "warm",
      values: [
        { name: "warm", value: "#FAF8F5" },
        { name: "white", value: "#FFFFFF" },
      ],
    },
  },
};

export default preview;
