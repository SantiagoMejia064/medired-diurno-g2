import { apiPost } from "./api.js";

const NOMBRES_ROL = {
  administrador: "Administrador",
  admisiones: "Admisiones",
  medico: "Médico"
};

export const obtenerUsuario = () => {
  try { return JSON.parse(sessionStorage.getItem("usuario") || "null"); }
  catch { return null; }
};
export const obtenerRol = () => obtenerUsuario()?.rol ?? null;
export const nombreRol = (rol = obtenerRol()) => NOMBRES_ROL[rol] || rol || "Sin rol";
export const tieneSesion = () => Boolean(sessionStorage.getItem("token") && obtenerUsuario());

export function cerrarSesion() {
  sessionStorage.removeItem("token");
  sessionStorage.removeItem("usuario");
  location.replace("/index.html");
}

export function protegerPagina() {
  if (!tieneSesion()) {
    location.replace("/index.html");
    return false;
  }
  document.querySelectorAll("[data-rol]").forEach(el => el.textContent = nombreRol());
  document.querySelectorAll("[data-nombre]").forEach(el => el.textContent = obtenerUsuario()?.nombre || obtenerUsuario()?.email || "Usuario");
  document.querySelectorAll("[data-salir]").forEach(el => el.addEventListener("click", cerrarSesion));
  document.body.hidden = false;
  return true;
}

const formulario = document.querySelector("#acceso");
if (formulario) {
  if (tieneSesion()) location.replace("/inicio.html");
  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const aviso = document.querySelector("#error-acceso");
    const boton = formulario.querySelector('button[type="submit"]');
    aviso.textContent = "";
    boton.disabled = true;
    boton.textContent = "Validando…";
    try {
      const email = formulario.elements.email.value.trim();
      const password = formulario.elements.password.value;
      const resultado = await apiPost("/usuarios/login", { email, password });
      if (!resultado?.token || !resultado?.usuario?.rol || !NOMBRES_ROL[resultado.usuario.rol]) {
        throw new Error("El servidor no devolvió una sesión válida o el rol no está habilitado.");
      }
      sessionStorage.setItem("token", resultado.token);
      sessionStorage.setItem("usuario", JSON.stringify(resultado.usuario));
      location.replace("/inicio.html");
    } catch (error) {
      aviso.textContent = error.message || "No fue posible iniciar sesión.";
    } finally {
      boton.disabled = false;
      boton.textContent = "Iniciar sesión";
    }
  });
}

if (document.body.hasAttribute("data-privado")) protegerPagina();
