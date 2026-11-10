
import Link from "next/link";
import OrderCard from "@/components/order-card";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import OrdersSummary from "@/components/orders-summary";
import type { OrderSummary } from "@/types/order-summary";
import RefreshOrders from "../../components/refresh-orders/refresh-orders";

export const instant = false;

//lee la info de la url para filtros (/orders?status=pending)
type OrdersPageProps = {
  searchParams: Promise<{ status?: string | string[] }>;
};

export default async function OrdersPage({ searchParams }: OrdersPageProps) {
  //primero busca el token, y si no existe  los devuelve a login
  const cookieStore = await cookies();
  const token = cookieStore.get("coffee_token")?.value;
  if (!token) redirect("/login");

  //obtiene el estado seleccionado para filtrar los pedidos
  const { status } = await searchParams;
  const selectedStatus = status === "pending" || status === "ready" ? status : undefined;

  //seleccionamos el endpoint
  const endpoint = selectedStatus
    ? `/orders/search?status=${selectedStatus}&limit=20` //saldria un limite de 20 
    : "/orders";

  //si existe el token se logea y le deja entrar a orders (pedidos)
  const response = await fetch(`${process.env.COFFEE_API_URL}${endpoint}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store", //para que no lea el cache 
  }).catch(() => null);

  if (response?.status === 401) redirect("/login");

  const data = response?.ok ? await response.json().catch(() => null) : null;
  const orders: OrderSummary[] | null = Array.isArray(data) ? data : null;

  //calcula el resumen a partir de los pedidos obtenidos
  const total = orders?.length ?? 0; //cuenta todos los pedidos

  const pending = orders?.filter( //selecciona los pedidos que cumplen una condición
    (order) => order.status === "pending"
  ).length ?? 0; //cuenta los elementos que quedaron después de filtrar.

  const ready = orders?.filter(
    (order) => order.status === "ready"
  ).length ?? 0;

  return (
    <main>
      <h1>Pedidos</h1>
      <Link href="/orders/new">Nuevo pedido</Link>
      
      <nav aria-label="Filtrar pedidos">
        <Link href="/orders" aria-current={!selectedStatus ? "page" : undefined}>
          Todos
        </Link>
        <Link href="/orders?status=pending" aria-current={selectedStatus === "pending" ? "page" : undefined}>
          Pendientes
        </Link>
        <Link href="/orders?status=ready" aria-current={selectedStatus === "ready" ? "page" : undefined}>
          Listos
        </Link>
      </nav>

      <RefreshOrders />

      {selectedStatus && <p>Hasta 20 pedidos para este filtro.</p>}

      {orders === null && (
        <p role="alert">No se pudieron consultar los pedidos.</p>
      )}

      {orders !== null && (
        <OrdersSummary
          total={total}
          pending={pending}
          ready={ready}
        />
      )}

      {orders?.length === 0 && (
        <p>No hay pedidos para mostrar.</p>
      )}

      {orders && orders.length > 0 && (
        <section className="orders-grid" aria-label="Listado de pedidos">
          {orders.map((order) => (
            <OrderCard key={order.id} order={order} />
          ))}
        </section>
      )}
    </main>
  );
}
