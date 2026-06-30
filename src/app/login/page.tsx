import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-rose-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-serif font-bold text-primary mb-2">Slogovo</h1>
          <p className="text-sm text-muted cyrillic">Български език</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
