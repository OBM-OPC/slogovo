import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const ALPHABET = "а б в г д и й п т ц ш щ ъ ю я";
const WORDS = "азбука банан вода градина дом";

function BulgarianTypography() {
  return (
    <div className="space-y-8 p-6">
      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">Normal weight</h2>
        <p lang="bg" className="mb-2 text-3xl text-foreground">
          {ALPHABET}
        </p>
        <p lang="bg" className="text-lg text-muted">
          {WORDS}
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">Bold weight</h2>
        <p lang="bg" className="mb-2 text-3xl font-bold text-foreground">
          {ALPHABET}
        </p>
        <p lang="bg" className="text-lg font-bold text-muted">
          {WORDS}
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">Learning context</h2>
        <div className="card text-center">
          <p className="mb-1 text-sm text-muted">Was heißt das auf Bulgarisch?</p>
          <p className="mb-4 text-2xl font-bold" lang="bg">
            вода
          </p>
          <div className="flex justify-center gap-2">
            <span lang="bg" className="rounded-xl bg-primary-50 px-3 py-2 font-medium text-primary">
              вода
            </span>
            <span lang="bg" className="rounded-xl bg-gray-100 px-3 py-2 font-medium text-foreground">
              вода
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

const meta = {
  title: "Visual Regression/Bulgarian Typography",
  component: BulgarianTypography,
  tags: ["!autodocs"],
} satisfies Meta<typeof BulgarianTypography>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
