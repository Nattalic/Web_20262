import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export const instant = false;

type LoginPageProps = {
  searchParams: Promise<{ error?: string; registered?: string }>;
};

async function login(formData: FormData) {
  "use server";

  const email = formData.get("email");
  const password = formData.get("password");

  const response = await fetch(`${process.env.COFFEE_API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  }).catch(() => null);

  if (!response?.ok) redirect("/login?error=1");

  //recibimos el token 
  //osea que el usuario ya se autentifico
  const data = await response.json().catch(() => null);
  const token = data?.access_token;
  if (typeof token !== "string" || !token) redirect("/login?error=1");

  //guarda eso en una cookie
  //
  const cookieStore = await cookies();
  cookieStore.set("coffee_token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 15 * 60,
  });

  redirect("/orders");
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error, registered } = await searchParams;


  //login action hace que el form ui ejecute la funcion de arriba que es la que realmente autentifica
  return (
    <main>
      <h1>Iniciar sesión</h1>
      {registered === "1" && <p>Cuenta creada. Ya puedes iniciar sesión.</p>}
      {error === "1" && <p role="alert">No se pudo iniciar sesión. Revisar los datos o la conexión.</p>}

      <form action={login}> 
        <p>
          <label>
            Email <input name="email" type="email" autoComplete="email" required />
          </label>
        </p>
        <p>
          <label>
            Contraseña
            <input name="password" type="password" autoComplete="current-password" required />
          </label>
        </p>
        <button type="submit">Entrar</button>
      </form>
      <p>
  ¿No tienes una cuenta? <Link href="/register">Crear cuenta</Link>
</p>
    </main>
  );
}