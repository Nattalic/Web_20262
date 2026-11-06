
import Link from "next/link";
import { redirect } from "next/navigation";

export const instant = false;

type RegisterPageProps = {
  searchParams: Promise<{ error?: string }>;
};

async function register(formData: FormData) {
  "use server";

  //recibe estos valores email y password
  const email = formData.get("email");
  const password = formData.get("password");

  //conexion entre front y back
  const response = await fetch( //peticion http
    `${process.env.COFFEE_API_URL}/auth/register`, //pobtiene la URL del backend desde .env
    //manda la peticiion
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }
  ).catch(() => null);

  //saber el estado del error
  if (response && !response.ok) {
  const errorData = await response.json().catch(() => null);
  console.log("Error del backend:", errorData);
}

  if (response?.status === 201) {
    redirect("/login?registered=1");
  }

  if (response?.status === 409) {
    redirect("/register?error=exists");
  }

  redirect("/register?error=1");
}

export default async function RegisterPage({
  searchParams,
}: RegisterPageProps) {
  const { error } = await searchParams;

  //diseño del form + validaciones
  return (
    <main>
      <h1>Crear cuenta</h1>

      {error === "exists" && (
        <p role="alert">
          Este correo ya está registrado.
        </p>
      )}

      {error === "1" && (
        <p role="alert">
          No se pudo crear la cuenta. Intenta nuevamente.
        </p>
      )}

      <form action={register}>
        <p>
          <label>
            Email
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
            />
          </label>
        </p>

        <p>
          <label>
            Contraseña
            <input
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            />
          </label>
        </p>

        <button type="submit">Crear cuenta</button>
      </form>

      <p>
        ¿Ya tienes una cuenta? <Link href="/login">Inicia sesión</Link>
      </p>
    </main>
  );
}
