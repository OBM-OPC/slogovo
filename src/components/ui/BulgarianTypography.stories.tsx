import type { Meta, StoryObj } from "@storybook/nextjs-vite";

const ALPHABET_CHARS = "а б в г д ж и й п т ц ш щ ъ ю я";
const WORDS = ["България", "Добър ден", "Как се казваш?"];

function BulgarianTypography() {
  return (
    <div className="space-y-10 p-6">
      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">Alphabet — regular weight</h2>
        <p lang="bg" className="mb-2 text-3xl text-foreground">
          {ALPHABET_CHARS}
        </p>
        <p lang="bg" className="text-lg text-muted">
          азбука банан вода градина дом
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">Weights</h2>
        <p lang="bg" className="mb-2 text-2xl text-foreground">
          <span className="font-normal">normal</span>{" "}
          <span className="font-medium">medium</span>{" "}
          <span className="font-semibold">semibold</span>{" "}
          <span className="font-bold">bold</span>
        </p>
        <p lang="bg" className="text-lg text-muted">
          <span className="font-normal">азбука</span>{" "}
          <span className="font-medium">банан</span>{" "}
          <span className="font-semibold">вода</span>{" "}
          <span className="font-bold">градина</span>
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-foreground">Representative words</h2>
        <div className="space-y-2">
          {WORDS.map((word) => (
            <p key={word} lang="bg" className="text-3xl font-bold text-foreground">
              {word}
            </p>
          ))}
        </div>
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
