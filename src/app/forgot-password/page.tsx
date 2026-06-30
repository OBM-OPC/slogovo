import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-rose-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-primary mb-2">Slogovo</h1>
          <p className="text-sm text-muted cyrillic">Български език</p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
