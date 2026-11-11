
import { obtenerRol, obtenerToken } from "./sesion.js";

// ============================================================
// CONFIGURACIÓN
// ============================================================

const API_URL = "http://127.0.0.1:3002/pacientes";

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

const puedeGestionar = obtenerRol() === "administrador";

let pacientes = [];
let idEnEdicion = null;

// ============================================================
// AUTENTICACIÓN
// ============================================================

function obtenerCabeceras() {
  const token = obtenerToken();

  if (!token) {
    throw new Error("No se encontró el token de sesión. Inicia sesión nuevamente.");
  }

  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };
}

// ============================================================
// PETICIONES A LA API
// ============================================================

async function solicitar(url, opciones = {}) {
  const respuesta = await fetch(url, {
    ...opciones,
    headers: {
      ...obtenerCabeceras(),
      ...opciones.headers
    }
  });

  if (respuesta.status === 204) {
    return null;
  }

  const contenido = await respuesta.json().catch(() => ({}));

  if (!respuesta.ok) {
    const mensaje = contenido.detalles
      ? `${contenido.error}: ${contenido.detalles.join(", ")}`
      : contenido.error || `Error HTTP ${respuesta.status}`;

    throw new Error(mensaje);
  }

  return contenido;
}

// ============================================================
// CREAR CELDAS Y BOTONES
// ============================================================

function agregarCelda(fila, texto) {
  const celda = fila.insertCell();
  celda.textContent = texto ?? "—";
  return celda;
}

function crearAccion(texto, ejecutar, clase = "") {
  const boton = document.createElement("button");

  boton.type = "button";
  boton.className = `accion ${clase}`;
  boton.textContent = texto;
  boton.addEventListener("click", ejecutar);

  return boton;
}

// ============================================================
// MOSTRAR DETALLE DEL PACIENTE
// ============================================================

function mostrarDetalle(paciente) {
  const campos = [
    ["Nombre completo", paciente.nombre],
    ["Documento", paciente.documento],
    ["Fecha de nacimiento", paciente.fecha_nacimiento],
    ["EPS", paciente.eps],
    ["Teléfono", paciente.telefono],
    ["ID del paciente", paciente.id]
  ];

  datosDetalle.replaceChildren();

  for (const [etiqueta, valor] of campos) {
    const termino = document.createElement("dt");
    const descripcion = document.createElement("dd");

    termino.textContent = etiqueta;
    descripcion.textContent = valor ?? "—";

    datosDetalle.append(termino, descripcion);
  }

  detalle.showModal();
}

// ============================================================
// ABRIR FORMULARIO PARA CREAR O EDITAR
// ============================================================

function abrirEditor(paciente = null) {
  if (!puedeGestionar) return;

  idEnEdicion = paciente?.id ?? null;

  formulario.reset();
  errorEditor.textContent = "";

  document.querySelector("#titulo-editor").textContent =
    paciente ? "Editar paciente" : "Nuevo paciente";

  document.querySelector("#guardar-paciente").textContent =
    paciente ? "Guardar cambios" : "Registrar paciente";

  if (paciente) {
    for (const campo of [
      "nombre",
      "documento",
      "fecha_nacimiento",
      "eps",
      "telefono"
    ]) {
      formulario.elements[campo].value = paciente[campo];
    }
  }

  editor.showModal();
}

// ============================================================
// VALIDAR DATOS DEL FORMULARIO
// ============================================================

function validarDatos(paciente) {
  if (
    !paciente.nombre ||
    !paciente.documento ||
    !paciente.fecha_nacimiento ||
    !paciente.eps ||
    !paciente.telefono
  ) {
    return "Todos los campos son obligatorios.";
  }

  if (!/^\d{6,10}$/.test(paciente.documento)) {
    return "El documento debe contener entre 6 y 10 dígitos.";
  }

  if (!/^\d{10}$/.test(paciente.telefono)) {
    return "El teléfono debe contener exactamente 10 dígitos.";
  }

  const fecha = new Date(`${paciente.fecha_nacimiento}T00:00:00`);

  if (
    Number.isNaN(fecha.getTime()) ||
    fecha.toISOString().slice(0, 10) !== paciente.fecha_nacimiento
  ) {
    return "La fecha de nacimiento no es válida.";
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  if (fecha > hoy) {
    return "La fecha de nacimiento no puede ser futura.";
  }

  return null;
}

// ============================================================
// GUARDAR O ACTUALIZAR PACIENTE
// ============================================================

async function guardarPaciente(evento) {
  evento.preventDefault();

  if (!puedeGestionar) return;

  errorEditor.textContent = "";

  const datos = new FormData(formulario);

  const paciente = {
    nombre: String(datos.get("nombre")).trim(),
    documento: String(datos.get("documento")).trim(),
    fecha_nacimiento: String(datos.get("fecha_nacimiento")),
    eps: String(datos.get("eps")).trim(),
    telefono: String(datos.get("telefono")).trim()
  };

  const errorValidacion = validarDatos(paciente);

  if (errorValidacion) {
    errorEditor.textContent = errorValidacion;
    return;
  }

  const esEdicion = idEnEdicion !== null;

  try {
    if (esEdicion) {
      await solicitar(`${API_URL}/${idEnEdicion}`, {
        method: "PUT",
        body: JSON.stringify(paciente)
      });

      aviso.textContent = "Paciente actualizado correctamente.";
    } else {
      await solicitar(API_URL, {
        method: "POST",
        body: JSON.stringify(paciente)
      });

      aviso.textContent = "Paciente registrado correctamente.";
    }

    editor.close();
    await cargarPacientes();

  } catch (error) {
    console.error("ERROR AL GUARDAR PACIENTE:", error);
    errorEditor.textContent = error.message;
  }
}

// ============================================================
// ELIMINAR PACIENTE
// ============================================================

async function eliminarPaciente(paciente) {
  if (!puedeGestionar) return;

  const confirmar = window.confirm(
    `¿Estás segura de que deseas eliminar al paciente ${paciente.nombre}?`
  );

  if (!confirmar) return;

  try {
    await solicitar(`${API_URL}/${paciente.id}`, {
      method: "DELETE"
    });

    aviso.textContent = "Paciente eliminado correctamente.";

    await cargarPacientes();

  } catch (error) {
    console.error("ERROR AL ELIMINAR PACIENTE:", error);
    aviso.textContent = `No se pudo eliminar el paciente: ${error.message}`;
  }
}

// ============================================================
// RENDERIZAR TABLA
// ============================================================

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

// ============================================================
// CARGAR PACIENTES DESDE NODE.JS Y MARIADB
// ============================================================

async function cargarPacientes() {
  estadoListado.hidden = false;
  estadoListado.textContent = "Cargando pacientes…";
  tabla.hidden = true;

  try {
    pacientes = await solicitar(API_URL);

    renderizarListado();

    console.log("========== PACIENTES CARGADOS ==========");
    console.log("TOTAL:", pacientes.length);
    console.log("RESPUESTA:", pacientes);
    console.log("=========================================");

  } catch (error) {
    console.error("ERROR AL CARGAR PACIENTES:", error);

    pacientes = [];
    filas.replaceChildren();
    tabla.hidden = true;
    estadoListado.hidden = false;
    estadoListado.textContent =
      `No se pudieron cargar los pacientes: ${error.message}`;
  }
}

// ============================================================
// INICIALIZAR FRONTEND
// ============================================================

async function iniciarPacientes() {
  document.querySelector("#fecha_nacimiento").max =
    new Date().toISOString().slice(0, 10);

  nuevoPaciente.addEventListener(
    "click",
    () => abrirEditor()
  );

  document
    .querySelector("#cancelar-editor")
    .addEventListener("click", () => editor.close());

  formulario.addEventListener(
    "submit",
    guardarPaciente
  );

  await cargarPacientes();
}

// ============================================================
// INICIAR SOLO SI EXISTE UNA SESIÓN
// ============================================================

if (obtenerRol()) {
  iniciarPacientes();
}
