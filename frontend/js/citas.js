import { api, apiPost, apiPut, apiDelete } from "./api.js";
import { obtenerRol, protegerPagina } from "./sesion.js";

const CONFIG = {"ruta": "/citas", "singular": "cita", "plural": "citas", "filas": "#filas-citas", "formulario": "#formulario-cita", "botonNuevo": "#nueva-cita", "rolesEscritura": ["administrador", "admisiones"], "referencias": true, "columnas": [{"campo": "fecha_hora"}, {"campo": "paciente"}, {"campo": "medico"}, {"campo": "sede"}, {"campo": "estado"}], "detalles": [["Fecha y hora", "fecha_hora"], ["Paciente", "paciente"], ["Documento paciente", "paciente.documento"], ["Médico", "medico"], ["Especialidad", "medico.especialidad"], ["Sede", "sede"], ["Estado", "estado"]], "campos": [{"name": "paciente_id", "tipo": "number"}, {"name": "medico_id", "tipo": "number"}, {"name": "fecha_hora"}, {"name": "sede"}, {"name": "estado"}]};
const rol = obtenerRol();
const puedeEscribir = CONFIG.rolesEscritura.includes(rol);
const $ = (selector) => document.querySelector(selector);
const filas = $(CONFIG.filas);
const tabla = $(".tabla-contenedor");
const estado = $("#estado-listado");
const aviso = $("#aviso");
const editor = $("#editor");
const formulario = $(CONFIG.formulario);
const errorEditor = $("#error-editor");
const detalle = $("#detalle");
const datosDetalle = $("#datos-detalle");
const botonNuevo = $(CONFIG.botonNuevo);
let registros = [];
let idEnEdicion = null;

if (!protegerPagina()) throw new Error("Sesión requerida");

function texto(valor) {
  if (valor === null || valor === undefined || valor === "") return "No registrado";
  return String(valor);
}
function crearAccion(etiqueta, accion, clase = "") {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = `accion ${clase}`;
  boton.textContent = etiqueta;
  boton.addEventListener("click", accion);
  return boton;
}
function celda(fila, valor) {
  const td = fila.insertCell();
  td.textContent = texto(valor);
  return td;
}
function valorRelacionado(registro, campo) {
  if (campo === "paciente") return registro.paciente?.nombre || `ID ${registro.paciente_id}`;
  if (campo === "medico") return registro.medico?.nombre || `ID ${registro.medico_id}`;
  if (campo.includes(".")) return campo.split(".").reduce((obj, key) => obj?.[key], registro);
  return registro[campo];
}
function renderizar() {
  const fragmento = document.createDocumentFragment();
  registros.forEach(registro => {
    const fila = document.createElement("tr");
    CONFIG.columnas.forEach(col => {
      const td = celda(fila, valorRelacionado(registro, col.campo));
      if (col.campo === "estado") {
        const etiqueta = document.createElement("span");
        etiqueta.className = `estado ${registro.estado || ""}`;
        etiqueta.textContent = texto(registro.estado);
        td.textContent = "";
        td.append(etiqueta);
      }
    });
    const acciones = document.createElement("div");
    acciones.className = "acciones";
    acciones.append(crearAccion("Ver", () => verDetalle(registro)));
    if (puedeEscribir) {
      acciones.append(
        crearAccion("Editar", () => abrirEditor(registro)),
        crearAccion("Eliminar", () => eliminarRegistro(registro), "peligro")
      );
    }
    fila.insertCell().append(acciones);
    fragmento.append(fila);
  });
  filas.replaceChildren(fragmento);
  tabla.hidden = registros.length === 0;
  estado.hidden = registros.length > 0;
  estado.textContent = registros.length ? "" : `No hay ${CONFIG.plural} registrados.`;
  if (botonNuevo) botonNuevo.hidden = !puedeEscribir;
  const modo = $("#modo-consulta");
  if (modo) modo.hidden = puedeEscribir;
}
function verDetalle(registro) {
  datosDetalle.replaceChildren();
  CONFIG.detalles.forEach(([label, campo]) => {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = label;
    dd.textContent = texto(valorRelacionado(registro, campo));
    datosDetalle.append(dt, dd);
  });
  if (registro.aviso) {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    dt.textContent = "Aviso del servicio";
    dd.textContent = registro.aviso;
    datosDetalle.append(dt, dd);
  }
  detalle.showModal();
}
function llenarSelect(select, opciones, valor) {
  select.replaceChildren();
  opciones.forEach(op => {
    const option = document.createElement("option");
    option.value = op.value;
    option.textContent = op.label;
    select.append(option);
  });
  select.value = valor ?? "";
}
async function cargarReferencias() {
  if (!CONFIG.referencias) return;
  const [pacientes, medicos] = await Promise.all([
    api("/pacientes"), api("/medicos")
  ]);
  llenarSelect(formulario.elements.paciente_id,
    [{value:"",label:"Selecciona un paciente"}, ...pacientes.map(x=>({value:x.id,label:`${x.nombre} · ${x.documento}`}))], "");
  llenarSelect(formulario.elements.medico_id,
    [{value:"",label:"Selecciona un médico"}, ...medicos.map(x=>({value:x.id,label:`${x.nombre} · ${x.especialidad}`}))], "");
}
async function abrirEditor(registro = null) {
  if (!puedeEscribir) return;
  idEnEdicion = registro?.id ?? null;
  formulario.reset();
  errorEditor.textContent = "";
  $("#titulo-editor").textContent = registro ? `Editar ${CONFIG.singular}` : `Nuevo ${CONFIG.singular}`;
  try {
    await cargarReferencias();
    CONFIG.campos.forEach(campo => {
      const control = formulario.elements[campo.name];
      if (control && registro) control.value = campo.name === "fecha_hora" ? String(registro[campo.name] || "").slice(0,16) : (registro[campo.name] ?? "");
    });
    if (registro && CONFIG.referencias) {
      formulario.elements.paciente_id.value = registro.paciente_id;
      formulario.elements.medico_id.value = registro.medico_id;
    }
    editor.showModal();
  } catch (error) {
    aviso.textContent = `No se pudieron cargar las opciones del formulario: ${error.message}`;
  }
}
async function eliminarRegistro(registro) {
  if (!puedeEscribir || !confirm(`¿Eliminar ${CONFIG.singular} #${registro.id}?`)) return;
  try {
    await apiDelete(`${CONFIG.ruta}/${registro.id}`);
    aviso.textContent = `${CONFIG.singular} eliminado correctamente.`;
    await cargar();
  } catch (error) { aviso.textContent = error.message; }
}
function obtenerDatosFormulario() {
  const datos = {};
  CONFIG.campos.forEach(campo => {
    let valor = formulario.elements[campo.name].value.trim();
    if (campo.tipo === "number") valor = Number(valor);
    datos[campo.name] = valor;
  });
  return datos;
}
formulario?.addEventListener("submit", async evento => {
  evento.preventDefault();
  if (!puedeEscribir) return;
  errorEditor.textContent = "";
  const datos = obtenerDatosFormulario();
  try {
    if (idEnEdicion === null) await apiPost(CONFIG.ruta, datos);
    else await apiPut(`${CONFIG.ruta}/${idEnEdicion}`, datos);
    editor.close();
    aviso.textContent = `${CONFIG.singular} ${idEnEdicion === null ? "creado" : "actualizado"} correctamente.`;
    await cargar();
  } catch (error) { errorEditor.textContent = error.message; }
});
$("#cancelar-editor")?.addEventListener("click", () => editor.close());
botonNuevo?.addEventListener("click", () => abrirEditor());
async function cargar() {
  estado.hidden = false;
  estado.textContent = `Consultando ${CONFIG.plural} en el servidor…`;
  tabla.hidden = true;
  try {
    const respuesta = await api(CONFIG.ruta);
    registros = Array.isArray(respuesta) ? respuesta : [];
    renderizar();
  } catch (error) {
    registros = [];
    filas.replaceChildren();
    estado.hidden = false;
    estado.textContent = error.message;
    aviso.textContent = error.message;
  }
}
cargar();
