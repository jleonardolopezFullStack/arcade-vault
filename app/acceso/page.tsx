import type { Metadata } from "next";

import { AuthForm } from "@/components/auth/auth-form";

export const metadata: Metadata = {
  title: "Acceso · Arcade Vault",
  description: "Entra al Arcade Vault o crea una cuenta para guardar tus marcas.",
};

export default function AccessPage() {
  return <AuthForm />;
}
