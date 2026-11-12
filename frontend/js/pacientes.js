
import { obtenerRol } from "./sesion.js";

const filas = document.querySelector("#filas-pacientes");
const tabla = document.querySelector(".tabla-contenedor");
const estadoListado = document.querySelector("#estado-listado");
const detalle = document.querySelector("#detalle");
const datosDetalle = document.querySelector("#datos-detalle");
const nuevoPaciente = document.querySelector("#nuevo-paciente");

const editor = document.querySelector("#editor");
const formulario = document.querySelector("#formulario-paciente");
const errorEditor = document.querySelector("#error-editor");
const aviso = document.querySelector("#aviso");

const CLAVE_PACIENTES = "medired.pacientes";

const puedeGestionar = obtenerRol() === "administrador";

let pacientes = [];
let idEnEdicion = null;


// Crea una celda de la tabla
function agregarCelda(fila, texto) {
  const celda = fila.insertCell();
  celda.textContent = texto ?? "";
  return celda;
}


// Crea un botón de acción
function crearAccion(texto, ejecutar, clase = "") {
  const boton = document.createElement("button");

  boton.type = "button";
  boton.className = `accion ${clase}`;
  boton.textContent = texto;
  boton.addEventListener("click", ejecutar);

  return boton;
}


// Muestra los detalles de un paciente
function mostrarDetalle(paciente) {
  const campos = [
    ["Nombre", paciente.nombre],
    ["Documento", paciente.documento],
    ["Fecha de nacimiento", paciente.fecha_nacimiento],
    ["EPS", paciente.eps],
    ["Teléfono", paciente.telefono],
  ];

  datosDetalle.replaceChildren();

  for (const [etiqueta, valor] of campos) {
    const termino = document.createElement("dt");
    const descripcion = document.createElement("dd");

    termino.textContent = etiqueta;
    descripcion.textContent = valor || "No registrado";

    datosDetalle.append(termino, descripcion);
  }

  detalle.showModal();
}


// Guarda los pacientes modificados en localStorage
function guardarDatos() {
  localStorage.setItem(
    CLAVE_PACIENTES,
    JSON.stringify(pacientes)
  );
}


// Abre el formulario para crear o editar
function abrirEditor(paciente = null) {
  if (!puedeGestionar) return;

  idEnEdicion = paciente?.id ?? null;

  formulario.reset();
  errorEditor.textContent = "";

  document.querySelector("#titulo-editor").textContent =
    paciente ? "Editar paciente" : "Nuevo paciente";

  if (paciente) {
    for (const campo of [
      "nombre",
      "documento",
      "fecha_nacimiento",
      "eps",
      "telefono",
    ]) {
      formulario.elements[campo].value = paciente[campo] ?? "";
    }
  }

  editor.showModal();
}


// Elimina un paciente
function eliminarPaciente(paciente) {
  if (!puedeGestionar) return;

  const confirmar = window.confirm(
    `¿Eliminar al paciente ${paciente.nombre}?`
  );

  if (!confirmar) return;

  pacientes = pacientes.filter(
    (registro) => registro.id !== paciente.id
  );

  guardarDatos();
  renderizarListado();

  aviso.textContent = "Paciente eliminado.";
}


// Valida los datos del paciente
function validarPaciente(paciente) {
  if (
    !paciente.nombre ||
    !paciente.documento ||
    !paciente.fecha_nacimiento ||
    !paciente.eps ||
    !paciente.telefono
  ) {
    return "Todos los campos son obligatorios.";
  }

  if (!/^\d{6,15}$/.test(paciente.documento)) {
    return "El documento debe contener entre 6 y 15 números.";
  }

  if (!/^\d{10}$/.test(paciente.telefono)) {
    return "El teléfono debe contener exactamente 10 números.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(paciente.fecha_nacimiento)) {
    return "La fecha de nacimiento no es válida.";
  }

  const fecha = new Date(
    `${paciente.fecha_nacimiento}T00:00:00`
  );

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (
    Number.isNaN(fecha.getTime()) ||
    fecha.toISOString().slice(0, 10) !== paciente.fecha_nacimiento
  ) {
    return "La fecha de nacimiento no es válida.";
  }

  if (fecha > hoy) {
    return "La fecha de nacimiento no puede ser futura.";
  }

  return null;
}


// Guarda o actualiza un paciente
function guardarPaciente(evento) {
  evento.preventDefault();

  if (!puedeGestionar) return;

  const datos = new FormData(formulario);

  const paciente = {
    nombre: String(datos.get("nombre")).trim(),
    documento: String(datos.get("documento")).trim(),
    fecha_nacimiento: String(datos.get("fecha_nacimiento")).trim(),
    eps: String(datos.get("eps")).trim(),
    telefono: String(datos.get("telefono")).trim(),
  };

  const error = validarPaciente(paciente);

  if (error) {
    errorEditor.textContent = error;
    return;
  }

  const duplicado = pacientes.some(
    (registro) =>
      registro.documento.toLowerCase() ===
        paciente.documento.toLowerCase() &&
      registro.id !== idEnEdicion
  );

  if (duplicado) {
    errorEditor.textContent = "El documento ya está registrado.";
    return;
  }

  if (idEnEdicion === null) {
    const nuevoId =
      Math.max(
        0,
        ...pacientes.map((registro) => registro.id)
      ) + 1;

    pacientes.push({
      id: nuevoId,
      ...paciente,
    });

    aviso.textContent = "Paciente creado.";
  } else {
    pacientes = pacientes.map((registro) =>
      registro.id === idEnEdicion
        ? {
            id: registro.id,
            ...paciente,
          }
        : registro
    );

    aviso.textContent = "Paciente actualizado.";
  }

  guardarDatos();
  renderizarListado();

  editor.close();
}


// Muestra los pacientes en la tabla
function renderizarListado() {
  const contenido = document.createDocumentFragment();

  for (const paciente of pacientes) {
    const fila = document.createElement("tr");

    agregarCelda(fila, paciente.nombre);
    agregarCelda(fila, paciente.documento);
    agregarCelda(fila, paciente.fecha_nacimiento);
    agregarCelda(fila, paciente.eps);
    agregarCelda(fila, paciente.telefono);

    const acciones = document.createElement("div");
    acciones.className = "acciones";

    acciones.append(
      crearAccion(
        "Ver detalle",
        () => mostrarDetalle(paciente)
      )
    );

    if (puedeGestionar) {
      acciones.append(
        crearAccion(
          "Editar",
          () => abrirEditor(paciente)
        ),
        crearAccion(
          "Eliminar",
          () => eliminarPaciente(paciente),
          "peligro"
        )
      );
    }

    fila.insertCell().append(acciones);
    contenido.append(fila);
  }

  filas.replaceChildren(contenido);

  tabla.hidden = pacientes.length === 0;

  estadoListado.hidden = pacientes.length > 0;
  estadoListado.textContent = "No hay pacientes registrados.";

  nuevoPaciente.hidden = !puedeGestionar;

  document.querySelector("#modo-consulta").hidden =
    puedeGestionar;
}


// Carga los datos iniciales
async function iniciarPacientes() {
  const respuesta = await fetch("data/pacientes.json");

  if (!respuesta.ok) {
    throw new Error("No se pudo cargar pacientes.json");
  }

  const iniciales = await respuesta.json();

  const guardados = localStorage.getItem(CLAVE_PACIENTES);

  pacientes =
    guardados === null
      ? iniciales
      : JSON.parse(guardados);

  renderizarListado();

  nuevoPaciente.addEventListener(
    "click",
    () => abrirEditor()
  );

  document
    .querySelector("#cancelar-editor")
    .addEventListener("click", () => editor.close());

  formulario.addEventListener("submit", guardarPaciente);

  window.addEventListener("storage", (evento) => {
    if (evento.key !== CLAVE_PACIENTES) return;

    pacientes =
      evento.newValue === null
        ? iniciales
        : JSON.parse(evento.newValue);

    renderizarListado();
  });
}


// Inicia pacientes si existe una sesión válida
if (obtenerRol()) {
  iniciarPacientes().catch((error) => {
    console.error(error);

    estadoListado.textContent =
      "No se pudieron cargar los pacientes. Verifica el servidor HTTP local y recarga.";
  });
}
