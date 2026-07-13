import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { login, type AuthRole } from "@/entities/auth/api/auth-api";
import { useAuthSession } from "@/entities/auth/hooks/useAuthSession";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const requestedPath = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;
  const authQuery = useAuthSession();
  const [formState, setFormState] = useState({
    login: "",
    password: "",
  });
  const [formError, setFormError] = useState("");

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ["auth", "session"] });
      navigate(resolvePostLoginPath(result.user.role, requestedPath), {
        replace: true,
      });
    },
    onError: (error: Error) => {
      setFormError(error.message);
    },
  });

  if (authQuery.data) {
    return <Navigate to={resolvePostLoginPath(authQuery.data.role)} replace />;
  }

  return (
    <div className="login-shell">
      <section className="login-card">
        <div className="brand-block brand-block--login">
          <div className="brand-mark">SF</div>
          <div>
            <strong>SolidFlow</strong>
            <p>Guvenli giris</p>
          </div>
        </div>

        <div className="login-copy">
          <h1>Sisteme giris yapin</h1>
          <p>Bu asamada backend auth temeli aktif. Devam etmek icin kullanici adi ve sifrenizi girin.</p>
        </div>

        <form
          className="login-form"
          onSubmit={(event) => {
            event.preventDefault();
            setFormError("");
            loginMutation.mutate(formState);
          }}
        >
          <label className="form-field">
            <span className="form-field__label">Kullanici adi veya e-posta</span>
            <input
              autoComplete="username"
              value={formState.login}
              onChange={(event) => setFormState((current) => ({ ...current, login: event.target.value }))}
            />
          </label>

          <label className="form-field">
            <span className="form-field__label">Sifre</span>
            <input
              type="password"
              autoComplete="current-password"
              value={formState.password}
              onChange={(event) => setFormState((current) => ({ ...current, password: event.target.value }))}
            />
          </label>

          {formError ? <div className="status-banner status-banner--danger">{formError}</div> : null}

          <button type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Giris yapiliyor..." : "Giris yap"}
          </button>
        </form>

        <div className="login-hint">
          <strong>Varsayilan admin</strong>
          <span>Kullanici adi: admin</span>
          <span>Sifre: Admin123!</span>
        </div>
      </section>
    </div>
  );
}

function resolvePostLoginPath(role: AuthRole, requestedPath?: string) {
  if (requestedPath) {
    return requestedPath;
  }

  if (role === "worker") {
    return "/user-workspace";
  }

  if (role === "manager") {
    return "/operations-center";
  }

  return "/dashboard";
}
