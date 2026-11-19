const API_BASE = "/api";

const MENSAJES_HTTP = {
  400: "Los datos enviados no son válidos. Revisa los campos e inténtalo nuevamente.",
  401: "No estás autenticado o tu sesión expiró. Inicia sesión nuevamente.",
  403: "No tienes permisos para realizar esta operación.",
  404: "No se encontró la ruta o el registro solicitado.",
  405: "El servidor no permite este método para la ruta solicitada. Verifica el endpoint.",
  409: "La operación genera un conflicto con un registro existente.",
  413: "La información enviada es demasiado grande.",
  415: "El formato de los datos enviados no es compatible.",
  422: "La información tiene errores de validación. Revisa los campos.",
  429: "Se hicieron demasiadas solicitudes. Espera un momento e inténtalo otra vez.",
  500: "Ocurrió un error interno en el servidor. Inténtalo más tarde.",
  502: "Apache no pudo comunicarse correctamente con el microservicio.",
  503: "El microservicio no está disponible temporalmente.",
  504: "El microservicio tardó demasiado en responder. Inténtalo nuevamente."
};

function extraerMensaje(datos, estado) {
  if (typeof datos === "string" && datos.trim()) return datos.trim();
  const base = datos?.error || datos?.mensaje || datos?.message || MENSAJES_HTTP[estado] || `Error HTTP ${estado}`;
  const errores = datos?.errores || datos?.details || datos?.detalles;
  const lista = Array.isArray(errores) ? errores.map(x => typeof x === "string" ? x : x?.msg || x?.message || JSON.stringify(x)) : [];
  return lista.length ? `${base} ${lista.join("; ")}` : base;
}

export class ApiError extends Error {
  constructor(message, status, data = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/**
 * auth:false se usa únicamente en el login, que todavía no tiene JWT.
 * Las demás llamadas adjuntan el token y tratan un 401 como sesión inválida.
 */
export async function api(ruta, opciones = {}) {
  const { auth = true, ...fetchOptions } = opciones;
  const token = auth ? sessionStorage.getItem("token") : null;
  const headers = new Headers(fetchOptions.headers || {});
  if (fetchOptions.body != null && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let respuesta;
  try {
    respuesta = await fetch(`${API_BASE}${ruta}`, { ...fetchOptions, headers });
  } catch {
    throw new ApiError("No fue posible comunicarse con MediRed. Comprueba la conexión y que Apache y los microservicios estén activos.", 0);
  }

  const tipo = respuesta.headers.get("content-type") || "";
  const datos = respuesta.status === 204 ? null : tipo.includes("application/json")
    ? await respuesta.json().catch(() => null)
    : await respuesta.text().catch(() => "");

  if (!respuesta.ok) {
    // Un 401 durante el login significa credenciales inválidas; no es una sesión vencida.
    if (respuesta.status === 401 && auth) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("usuario");
      if (!location.pathname.endsWith("/index.html") && !location.pathname.endsWith("/login.html") && location.pathname !== "/") {
        location.replace("/login.html");
      }
      throw new ApiError("Tu sesión expiró o el token no es válido. Inicia sesión nuevamente.", 401, datos);
    }
    throw new ApiError(extraerMensaje(datos, respuesta.status), respuesta.status, datos);
  }

  return datos;
}

export const apiGet = (ruta, opciones = {}) => api(ruta, { ...opciones, method: "GET" });
export const apiPost = (ruta, datos, opciones = {}) => api(ruta, { ...opciones, method: "POST", body: JSON.stringify(datos) });
export const apiPut = (ruta, datos, opciones = {}) => api(ruta, { ...opciones, method: "PUT", body: JSON.stringify(datos) });
export const apiDelete = (ruta, opciones = {}) => api(ruta, { ...opciones, method: "DELETE" });
