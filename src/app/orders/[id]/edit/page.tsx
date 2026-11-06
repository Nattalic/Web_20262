
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { OrderSummary } from "@/types/order-summary";

export const instant = false;

type EditOrderPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
};

async function updateOrder(formData: FormData) {
  "use server";

  const id = String(formData.get("id") ?? "");
  const item = String(formData.get("item") ?? "");
  const quantity = Number(formData.get("quantity"));
  const status = String(formData.get("status") ?? "");

  if (
    !id ||
    !item.trim() ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    !["pending", "ready"].includes(status)
  ) {
    redirect(`/orders/${encodeURIComponent(id)}/edit?error=1`);
  }

  //recupera jtw token
  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;

  if (!token) redirect("/login");

  //conectar a back
  const response = await fetch(
    `${process.env.COFFEE_API_URL}/orders/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ item, quantity, status }),
    }
  ).catch(() => null);

  console.log("Estado de edición:", response?.status);

  if (response?.status === 401) redirect("/login");

  if (!response?.ok) {
    const errorData = await response?.json().catch(() => null);
    console.log("Error al editar:", errorData);

    redirect(`/orders/${encodeURIComponent(id)}/edit?error=1`);
  }

  revalidatePath("/orders");
  redirect("/orders");
}

export default async function EditOrderPage({
    //obtiene el id
  params,
  searchParams,
}: EditOrderPageProps) {
  const { id } = await params;
  const { error } = await searchParams;

  //recibe el token
  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;

  //si  no lo devuelve a login
  if (!token) redirect("/login");

  const response = await fetch(
    `${process.env.COFFEE_API_URL}/orders`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    }
  ).catch(() => null);

  if (response?.status === 401) redirect("/login");

  if (!response?.ok) {
    return <p>No se pudieron cargar los pedidos.</p>;
  }

  const data = await response.json().catch(() => null);
  const orders: OrderSummary[] = Array.isArray(data) ? data : [];

  const order = orders.find(
    (order) => String(order.id) === id
  );

  if (!order) {
    return <p>No se encontró el pedido.</p>;
  }

  return (
    <main>
      <h1>Editar pedido #{order.id}</h1>

      {error === "1" && (
        <p role="alert">
          No se pudo actualizar el pedido.
        </p>
      )}

      <form action={updateOrder}>
        <input type="hidden" name="id" value={order.id} />

        <p>
          <label>
            Producto
            <input
              name="item"
              defaultValue={order.item}
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
              min="1"
              defaultValue={order.quantity}
              required
            />
          </label>
        </p>

        <p>
          <label>
            Estado
            <select name="status" defaultValue={order.status}>
              <option value="pending">Pendiente</option>
              <option value="ready">Listo</option>
            </select>
          </label>
        </p>

        <button type="submit">Guardar cambios</button>
      </form>

      <p>
        <Link href="/orders">Cancelar</Link>
      </p>
    </main>
  );
}
