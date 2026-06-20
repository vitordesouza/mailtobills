"use client";

import { useEffect, useState } from "react";

import { useRouter } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useTranslations } from "next-intl";

import { cn } from "@mailtobills/ui/lib/utils";
import { Logo } from "@mailtobills/ui/components/logo";
import { Input } from "@mailtobills/ui/components/input";
import { Button } from "@mailtobills/ui/components/button";
import { Card, CardContent } from "@mailtobills/ui/components/card";
import { LocaleSelect } from "@/components/locale-select";

import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldDescription,
} from "@mailtobills/ui/components/field";

type AuthMode = "signIn" | "signUp";
type Props = {
  initialMode: AuthMode;
};

const devAuthEmail = process.env.NEXT_PUBLIC_DEV_AUTH_EMAIL;
const devAuthPassword = process.env.NEXT_PUBLIC_DEV_AUTH_PASSWORD;
const isDevAuthEnabled =
  process.env.NODE_ENV === "development" &&
  Boolean(devAuthEmail && devAuthPassword);

export function LoginForm({
  className,
  initialMode,
  ...props
}: React.ComponentProps<"div"> & Props) {
  const [mode, setMode] = useState<AuthMode>(initialMode);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const router = useRouter();
  const t = useTranslations("Auth");
  const { signIn } = useAuthActions();
  const { isLoading } = useConvexAuth();

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const heroSubtitle =
    mode === "signIn" ? t("signInSubtitle") : t("signUpSubtitle");

  const resetFeedback = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const handleOAuthSignIn = async (provider: string) => {
    resetFeedback();
    try {
      setOauthLoading(provider);
      const result = await signIn(provider, { redirectTo: "/" });

      if (result.redirect) {
        window.location.href = result.redirect.toString();
        return;
      }

      router.replace("/");
    } catch (error) {
      console.error("OAuth sign-in failed", {
        message: error instanceof Error ? error.message : "Unknown error",
        provider,
      });
      setErrorMessage(t("oauthError"));
    } finally {
      setOauthLoading(null);
    }
  };

  const handlePasswordSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault();
    resetFeedback();

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      setErrorMessage(t("missingCredentials"));
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await signIn("password", {
        flow: mode,
        email: trimmedEmail,
        password,
      });

      if (result.redirect) {
        window.location.href = result.redirect.toString();
        return;
      }

      router.replace("/");
    } catch (error) {
      console.error("Password authentication failed", {
        message: error instanceof Error ? error.message : "Unknown error",
        mode,
      });
      setErrorMessage(t("signInError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDevAuth = async () => {
    if (!devAuthEmail || !devAuthPassword) return;

    resetFeedback();

    try {
      setIsSubmitting(true);

      try {
        const result = await signIn("password", {
          flow: "signIn",
          email: devAuthEmail.trim().toLowerCase(),
          password: devAuthPassword,
        });

        if (result.redirect) {
          window.location.href = result.redirect.toString();
          return;
        }

        router.replace("/");
        return;
      } catch (signInError) {
        console.log("Dev auth sign-in failed, attempting account creation", {
          email: devAuthEmail,
          error:
            signInError instanceof Error
              ? signInError.message
              : "Unknown sign-in error",
        });
      }

      const result = await signIn("password", {
        flow: "signUp",
        email: devAuthEmail.trim().toLowerCase(),
        password: devAuthPassword,
      });

      if (result.redirect) {
        window.location.href = result.redirect.toString();
        return;
      }

      router.replace("/");
    } catch (error) {
      console.error("Development account authentication failed", {
        message: error instanceof Error ? error.message : "Unknown error",
      });
      setErrorMessage(t("devAccountError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="overflow-hidden p-0">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-6 md:p-8" onSubmit={handlePasswordSubmit}>
            <FieldGroup>
              <div className="ml-auto w-full max-w-44">
                <LocaleSelect id="auth-language" label={t("language")} />
              </div>
              <div className="flex flex-col items-center gap-2 text-center">
                <h1 className="text-2xl font-bold">
                  {mode === "signIn" ? t("signInTitle") : t("signUpTitle")}
                </h1>
                <p className="text-muted-foreground text-balance">
                  {heroSubtitle}
                </p>
              </div>

              <Field>
                <FieldLabel htmlFor="email">{t("email")}</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder={t("emailPlaceholder")}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting || isLoading}
                  required
                />
              </Field>
              <Field>
                <div className="flex items-center">
                  <FieldLabel htmlFor="password">{t("password")}</FieldLabel>
                  {/* {mode === "signIn" && (
                    <a
                      href="#"
                      className="ml-auto text-sm underline-offset-2 hover:underline"
                    >
                      Forgot your password?
                    </a>
                  )} */}
                </div>
                <Input
                  id="password"
                  type="password"
                  autoComplete={
                    mode === "signIn" ? "current-password" : "new-password"
                  }
                  placeholder={t("passwordPlaceholder")}
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isSubmitting || isLoading}
                  required
                />
              </Field>

              <Field>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || isLoading}
                >
                  {isSubmitting
                    ? t("pleaseWait")
                    : mode === "signIn"
                      ? t("signInWithPassword")
                      : t("createAccount")}
                </Button>
                {isDevAuthEnabled ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-2 w-full"
                    disabled={isSubmitting || isLoading}
                    onClick={handleDevAuth}
                  >
                    {t("useDevAccount")}
                  </Button>
                ) : null}
              </Field>

              <FieldSeparator className="*:data-[slot=field-separator-content]:bg-card">
                {t("continueWith")}
              </FieldSeparator>

              <Field className="flex flex-col gap-4">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => handleOAuthSignIn("github")}
                  disabled={Boolean(oauthLoading) || isLoading}
                >
                  {oauthLoading === "github" ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
                          fill="currentColor"
                        />
                      </svg>
                      <span>GitHub</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => handleOAuthSignIn("google")}
                  disabled={Boolean(oauthLoading) || isLoading}
                >
                  {oauthLoading === "google" ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    <>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <path
                          d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                          fill="currentColor"
                        />
                      </svg>
                      <span>Google</span>
                    </>
                  )}
                </Button>
              </Field>

              {(errorMessage || successMessage) && (
                <div
                  className={cn(
                    "rounded-md border px-3 py-2 text-sm",
                    errorMessage
                      ? "border-red-200 bg-red-50 text-red-700"
                      : "border-green-200 bg-green-50 text-green-700",
                  )}
                  role="status"
                  aria-live="polite"
                >
                  {errorMessage ?? successMessage}
                </div>
              )}

              <FieldDescription className="text-center">
                {mode === "signIn" ? (
                  <>
                    {t("newCustomer")}{" "}
                    <button
                      type="button"
                      className="cursor-pointer font-semibold underline-offset-4 hover:underline"
                      onClick={() => {
                        resetFeedback();
                        setMode("signUp");
                      }}
                    >
                      {t("createAccount")}
                    </button>
                  </>
                ) : (
                  <>
                    {t("existingCustomer")}{" "}
                    <button
                      type="button"
                      className="cursor-pointer font-semibold underline-offset-4 hover:underline"
                      onClick={() => {
                        resetFeedback();
                        setMode("signIn");
                      }}
                    >
                      {t("signInInstead")}
                    </button>
                  </>
                )}
              </FieldDescription>
            </FieldGroup>
          </form>
          <div className="bg-sidebar relative hidden p-4 md:block">
            <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed">
              <div className="flex items-center gap-3">
                <span className="bg-primary text-primary-foreground flex size-12 items-center justify-center rounded-lg">
                  <Logo className="size-8" />
                </span>
                <h1 className="text-foreground text-3xl font-bold tracking-tight">
                  MailToBills
                </h1>
              </div>
              <div className="flex flex-col gap-2 p-12">
                <p className="text-muted-foreground font-mono text-[11px] font-medium tracking-[0.08em] uppercase">
                  {t("tagline")}
                </p>
                <h2 className="text-foreground text-2xl font-bold tracking-tight">
                  {t("heroTitle")}
                </h2>
                <p className="text-muted-foreground max-w-2xl text-base">
                  {t("heroDescription")}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        {t("legal")}
      </FieldDescription>
    </div>
  );
}
