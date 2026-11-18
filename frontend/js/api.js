const API_BASE = "/api";

export async function api(ruta, opciones = {}) {
  const token = sessionStorage.getItem("token");
  const headers = new Headers(opciones.headers || {});
  if (opciones.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE}${ruta}`, { ...opciones, headers });
  } catch {
    throw new Error("No fue posible comunicarse con MediRed. Verifica la conexión o el API Gateway.");
  }

  if (respuesta.status === 401) {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("usuario");
    if (!location.pathname.endsWith("/index.html") && location.pathname !== "/") {
      location.replace("/index.html");
    }
    throw new Error("La sesión terminó o el token no es válido. Inicia sesión nuevamente.");
  }

  const tipo = respuesta.headers.get("content-type") || "";
  const datos = respuesta.status === 204 ? null :
    (tipo.includes("application/json") ? await respuesta.json().catch(() => null) : await respuesta.text().catch(() => ""));

  if (!respuesta.ok) {
    const mensajes = {
      400: "Los datos enviados no son válidos.",
      403: "Tu rol no tiene permiso para realizar esta operación.",
      404: "No se encontró el registro solicitado.",
      409: "El registro entra en conflicto con información existente.",
      503: "Un servicio de MediRed no está disponible temporalmente."
    };
    const detalle = Array.isArray(datos?.errores) ? ` ${datos.errores.join("; ")}` : "";
    throw new Error(`${datos?.error || datos?.mensaje || mensajes[respuesta.status] || `Error HTTP ${respuesta.status}`}${detalle}`);
  }
  return datos;
}

export const apiGet = (ruta) => api(ruta);
export const apiPost = (ruta, datos) => api(ruta, { method: "POST", body: JSON.stringify(datos) });
export const apiPut = (ruta, datos) => api(ruta, { method: "PUT", body: JSON.stringify(datos) });
export const apiDelete = (ruta) => api(ruta, { method: "DELETE" });
