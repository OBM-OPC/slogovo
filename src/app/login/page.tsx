import LoginForm from "@/components/auth/LoginForm";
import { AuthPageShell } from "@/components/auth/AuthPageShell";

export default function LoginPage() {
  return (
    <AuthPageShell mode="login"><LoginForm /></AuthPageShell>
  );
}
