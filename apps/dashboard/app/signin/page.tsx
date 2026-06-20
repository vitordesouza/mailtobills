import { LoginForm } from "@/components/login-form";

type PageProps = {
  searchParams?: Promise<{
    mode?: string | string[];
  }>;
};

export default async function SignInPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const mode =
    typeof params?.mode === "string" ? params.mode : params?.mode?.[0];

  const initialMode = mode === "signup" ? "signUp" : "signIn";

  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="bg-muted flex min-h-svh flex-col items-center justify-center p-6 md:p-10"
    >
      <div className="w-full max-w-sm md:max-w-4xl">
        <LoginForm initialMode={initialMode} />
      </div>
    </main>
  );
}
