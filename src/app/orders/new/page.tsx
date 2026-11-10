
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export const instant = false;

type NewOrderPageProps = {
  searchParams: Promise<{ error?: string }>;
};

async function createOrder(formData: FormData) {
  "use server";

  //Obtiene los datos del formulario
  const item = String(formData.get("item") ?? "").trim();
  const quantity = Number(formData.get("quantity"));
  const customerId = Number(formData.get("customerId"));

  //Valida los datos antes de enviarlos al backend
  if (
    !item ||
    item.length > 80 ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 20 ||
    !Number.isInteger(customerId) ||
    customerId < 1
  ) {
    redirect("/orders/new?error=invalid");
  }

  //Busca el token del usuario
  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;

  if (!token) redirect("/login");

  //Envia el nuevo pedido al backend
  const response = await fetch(
    `${process.env.COFFEE_API_URL}/orders`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        item,
        quantity,
        customerId,
      }),
    }
  ).catch(() => null);

  if (response?.status === 401) redirect("/login");

  if (response?.status === 404) {
    redirect("/orders/new?error=customer");
  }

  if (response?.status === 400) {
    redirect("/orders/new?error=invalid");
  }

  if (response?.status !== 201) {
    redirect("/orders/new?error=1");
  }

  revalidatePath("/orders");
  redirect("/orders");
}

export default async function NewOrderPage({
  searchParams,
}: NewOrderPageProps) {
  const { error } = await searchParams;

  return (
    <main>
      <h1>Nuevo pedido</h1>

      {error === "customer" && (
        <p role="alert">
          El cliente no existe.
        </p>
      )}

      {error === "invalid" && (
        <p role="alert">
          Los datos del pedido no son válidos.
        </p>
      )}

      {error === "1" && (
        <p role="alert">
          No se pudo crear el pedido. Intenta nuevamente.
        </p>
      )}

      <form action={createOrder}>
        <p>
          <label>
            Producto
            <input
              name="item"
              type="text"
              maxLength={80}
              required
            />
          </label>
        </p>

        <p>
          <label>
            Cantidad
            <input
              name="quantity"
              type="number"
              min={1}
              max={20}
              step={1}
              required
            />
          </label>
        </p>

        <p>
          <label>
            ID del cliente
            <input
              name="customerId"
              type="number"
              min={1}
              step={1}
              required
            />
          </label>
        </p>

        <button type="submit">
          Crear pedido
        </button>
      </form>

      <p>
        <Link href="/orders">Cancelar</Link>
      </p>
    </main>
  );
}
