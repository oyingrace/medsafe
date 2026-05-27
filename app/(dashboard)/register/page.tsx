import { BatchRegistrationForm } from "@/components/BatchRegistrationForm";

export default function RegisterPage() {
  return (
    <main className="mx-auto w-full max-w-5xl p-6 space-y-4">
      <h1 className="text-2xl font-bold">Register Drug Batch</h1>
      <BatchRegistrationForm />
    </main>
  );
}
