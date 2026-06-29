import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#009B77]/5 to-[#D62612]/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-[#009B77] mb-2">Slogovo</h1>
          <p className="text-gray-600">Български език</p>
        </div>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
