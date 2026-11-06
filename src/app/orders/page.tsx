import OrderCard from "@/components/order-card";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import OrdersSummary from "@/components/orders-summary";
import { OrderSummary } from "@/types/order-summary";

export const instant = false;

export default async function OrdersPage() {
  //primero busca el token, y si no existe  los devuelve a login
  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;
  if (!token) redirect("/login");
  
  //si existe, entonces se logea
  const response = await fetch(`${process.env.COFFEE_API_URL}/orders`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  }).catch(() => null);

  if (response?.status === 401) redirect("/login");

  if (!response?.ok) {
    return (
      <main>
        <p>No se pudieron cargar los pedidos.</p>
      </main>
    );
  }

  const data = await response.json().catch(() => null);
  const orders: OrderSummary[] = Array.isArray(data) ? data : [];

  const total = orders.length; //cuenta todos los pedidos

  const pending = orders.filter( //selecciona los pedidos que cumplen una condición
    (order) => order.status === "pending"
  ).length; //cuenta los elementos que quedaron después de filtrar.

  const ready = orders.filter(
    (order) => order.status === "ready"
  ).length;

  return (
    <main>
      <h1>Pedidos</h1>

      <OrdersSummary
        total={total}
        pending={pending}
        ready={ready}
      />

       <section className="orders-grid" aria-label="Listado de pedidos">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} />
        ))}
      </section>
    </main>
  );
}