import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const from = process.env.FROM_EMAIL || "noreply@slogovo.de";

  await transporter.sendMail({
    from,
    to,
    subject: "Passwort zurücksetzen - Slogovo",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #009B77;">Passwort zurücksetzen</h1>
        <p>Hallo,</p>
        <p>Du hast eine Anfrage zum Zurücksetzen deines Passworts gestellt. Klicke auf den folgenden Link, um ein neues Passwort zu erstellen:</p>
        <p style="margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #009B77; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Passwort zurücksetzen</a>
        </p>
        <p>Oder kopiere diesen Link in deinen Browser:</p>
        <p style="word-break: break-all; color: #6B7280;">${resetUrl}</p>
        <p>Dieser Link ist 1 Stunde gültig.</p>
        <p>Wenn du diese Anfrage nicht gestellt hast, kannst du diese E-Mail ignorieren.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6B7280; font-size: 12px;">
          Slogovo - Bulgarisch lernen<br />
          <a href="https://slogovo.de" style="color: #009B77;">slogovo.de</a>
        </p>
      </div>
    `,
  });
}

export async function sendWelcomeEmail(to: string, name?: string) {
  const from = process.env.FROM_EMAIL || "noreply@slogovo.de";

  await transporter.sendMail({
    from,
    to,
    subject: "Willkommen bei Slogovo! 🇧🇬",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #009B77;">Willkommen bei Slogovo!</h1>
        <p>Hallo${name ? ` ${name}` : ""},</p>
        <p>Willkommen bei Slogovo, deiner App zum Bulgarisch-Lernen! Wir freuen uns, dass du dabei bist.</p>
        <p>Hier sind einige Tipps, um zu starten:</p>
        <ul>
          <li>Beginne mit unserem interaktiven kyrillischen Alphabet</li>
          <li>Arbeite die ersten Lektionen durch</li>
          <li>Verwende den Vokabeltrainer für tägliche Übungen</li>
        </ul>
        <p style="margin: 20px 0;">
          <a href="https://slogovo.de/kurs" style="background-color: #009B77; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Jetzt loslegen</a>
        </p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
        <p style="color: #6B7280; font-size: 12px;">
          Slogovo - Bulgarisch lernen<br />
          <a href="https://slogovo.de" style="color: #009B77;">slogovo.de</a>
        </p>
      </div>
    `,
  });
}
