const CLAVE_ROL = "medired.rol";
const ROLES = new Map([
  ["administrador", "Administrador"],
  ["admisiones", "Admisiones"],
  ["medico", "Médico"],
]);

export function obtenerRol() {
  const rol = localStorage.getItem(CLAVE_ROL);
  return ROLES.has(rol) ? rol : null;
}

export function puedeGestionarCitas() {
  return ["administrador", "admisiones"].includes(obtenerRol());
}

const rol = obtenerRol();
const acceso = document.querySelector("#acceso");

if (acceso) {
  if (rol) location.replace("inicio.html");
  acceso.addEventListener("submit", (evento) => {
    evento.preventDefault();
    const seleccionado = acceso.elements.rol.value;
    if (!ROLES.has(seleccionado)) return;

    localStorage.setItem(CLAVE_ROL, seleccionado);
    location.replace("inicio.html");
  });
} else if (document.body.hasAttribute("data-privado")) {
  if (!rol) {
    location.replace("index.html");
  } else {
    document.querySelectorAll("[data-rol]").forEach((elemento) => {
      elemento.textContent = ROLES.get(rol);
    });
    document.querySelector("[data-salir]").addEventListener("click", () => {
      localStorage.removeItem(CLAVE_ROL);
      location.replace("index.html");
    });
    document.body.hidden = false;
  }
}

window.addEventListener("pageshow", (evento) => {
  if (evento.persisted && obtenerRol() !== rol) location.reload();
});

window.addEventListener("storage", (evento) => {
  if ((evento.key === CLAVE_ROL || evento.key === null) && obtenerRol() !== rol) {
    location.reload();
  }
});
