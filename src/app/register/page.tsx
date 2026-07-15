import RegisterForm from "@/components/auth/RegisterForm";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

export default function RegisterPage() {
  return (
    <AuthPageShell mode="register"><RegisterForm /></AuthPageShell>
  );
}
