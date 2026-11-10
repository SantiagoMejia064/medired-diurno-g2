import { obtenerRol, puedeGestionarCitas } from "./sesion.js";
import {
  CLAVE_CITAS, ESTADOS, SEDES, cargarDatos, leerCitas, guardarCita, eliminarCita,
} from "./datos-citas.js";

const nuevaCita = document.querySelector("#nueva-cita");
const filas = document.querySelector("#filas-citas");
const tabla = document.querySelector(".tabla-contenedor");
const estadoListado = document.querySelector("#estado-listado");
const aviso = document.querySelector("#aviso");
const editor = document.querySelector("#editor");
const formulario = document.querySelector("#formulario-cita");
const errorEditor = document.querySelector("#error-editor");
const detalle = document.querySelector("#detalle");
const datosDetalle = document.querySelector("#datos-detalle");
const formatoFecha = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium", timeStyle: "short", hourCycle: "h23",
});

function formatearFecha(valor) {
  return formatoFecha.format(new Date(valor));
}

function agregarCelda(fila, texto) {
  const celda = fila.insertCell();
  celda.textContent = texto;
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

function mostrarDetalle(cita, paciente, medico) {
  const campos = [
    ["Fecha y hora", formatearFecha(cita.fecha_hora)],
    ["Sede de la cita", cita.sede],
    ["Estado", ESTADOS[cita.estado]],
    ["Paciente", paciente?.nombre ?? "Paciente no disponible"],
    ["Documento", paciente?.documento ?? "—"],
    ["EPS", paciente?.eps ?? "—"],
    ["Médico", medico?.nombre ?? "Médico no disponible"],
    ["Especialidad", medico?.especialidad ?? "—"],
  ];

  datosDetalle.replaceChildren();
  for (const [etiqueta, valor] of campos) {
    const termino = document.createElement("dt");
    const descripcion = document.createElement("dd");
    termino.textContent = etiqueta;
    descripcion.textContent = valor;
    datosDetalle.append(termino, descripcion);
  }
  detalle.showModal();
}

function llenarOpciones(campo, opciones, marcador) {
  if (marcador) {
    const opcion = new Option(marcador, "", true, true);
    opcion.disabled = true;
    campo.add(opcion);
  }
  for (const [valor, etiqueta] of opciones) campo.add(new Option(etiqueta, valor));
}

async function iniciarCitas() {
  const datos = await cargarDatos();
  let idEnEdicion = null;

  llenarOpciones(formulario.elements.paciente_id,
    datos.pacientes.map(({ id, nombre }) => [id, nombre]), "Selecciona un paciente");
  llenarOpciones(formulario.elements.medico_id,
    datos.medicos.map(({ id, nombre }) => [id, nombre]), "Selecciona un médico");
  llenarOpciones(formulario.elements.sede, SEDES.map((sede) => [sede, sede]), "Selecciona una sede");
  llenarOpciones(formulario.elements.estado, Object.entries(ESTADOS));

  function abrirEditor(cita) {
    if (!puedeGestionarCitas()) return;
    idEnEdicion = cita?.id ?? null;
    formulario.reset();
    errorEditor.textContent = "";
    document.querySelector("#titulo-editor").textContent = cita ? "Editar cita" : "Nueva cita";
    if (cita) {
      for (const campo of ["paciente_id", "medico_id", "fecha_hora", "sede", "estado"]) {
        formulario.elements[campo].value = cita[campo];
      }
    }
    editor.showModal();
  }

  async function confirmarEliminacion(cita) {
    if (!puedeGestionarCitas()) return;
    if (!window.confirm(`¿Eliminar la cita del ${formatearFecha(cita.fecha_hora)}?`)) return;

    try {
      await eliminarCita(datos, cita.id);
      renderizarListado();
      nuevaCita.focus();
      aviso.textContent = "Cita eliminada.";
    } catch (error) {
      aviso.textContent = error.message;
    }
  }

  function renderizarListado() {
    const citas = [...leerCitas(datos)].sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora));
    const puedeEditar = puedeGestionarCitas();
    const contenido = document.createDocumentFragment();

    for (const cita of citas) {
      const paciente = datos.pacientes.find(({ id }) => id === cita.paciente_id);
      const medico = datos.medicos.find(({ id }) => id === cita.medico_id);
      const fila = document.createElement("tr");
      agregarCelda(fila, formatearFecha(cita.fecha_hora));
      agregarCelda(fila, paciente?.nombre ?? "Paciente no disponible");
      agregarCelda(fila, medico?.nombre ?? "Médico no disponible");
      agregarCelda(fila, cita.sede);

      const estado = document.createElement("span");
      estado.className = `estado ${cita.estado}`;
      estado.textContent = ESTADOS[cita.estado];
      fila.insertCell().append(estado);

      const acciones = document.createElement("div");
      acciones.className = "acciones";
      acciones.append(crearAccion("Ver detalle", () => mostrarDetalle(cita, paciente, medico)));
      if (puedeEditar) {
        acciones.append(
          crearAccion("Editar", () => abrirEditor(cita)),
          crearAccion("Eliminar", () => confirmarEliminacion(cita), "peligro"),
        );
      }
      fila.insertCell().append(acciones);
      contenido.append(fila);
    }

    filas.replaceChildren(contenido);
    tabla.hidden = citas.length === 0;
    estadoListado.hidden = citas.length > 0;
    estadoListado.textContent = "No hay citas registradas.";
    nuevaCita.hidden = !puedeEditar;
    document.querySelector("#modo-consulta").hidden = puedeEditar;
  }

  renderizarListado();
  nuevaCita.addEventListener("click", () => abrirEditor());
  document.querySelector("#cancelar-editor").addEventListener("click", () => editor.close());
  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const campos = new FormData(formulario);
    const cita = {
      paciente_id: Number(campos.get("paciente_id")),
      medico_id: Number(campos.get("medico_id")),
      fecha_hora: campos.get("fecha_hora"),
      sede: campos.get("sede"),
      estado: campos.get("estado"),
    };

    const submit = evento.submitter;
    if (submit) submit.disabled = true;
    errorEditor.textContent = "";
    try {
      await guardarCita(datos, cita, idEnEdicion);
      editor.close();
      renderizarListado();
      nuevaCita.focus();
      aviso.textContent = idEnEdicion === null ? "Cita creada." : "Cita actualizada.";
    } catch (error) {
      errorEditor.textContent = error.message;
    } finally {
      if (submit) submit.disabled = false;
    }
  });

  window.addEventListener("storage", (evento) => {
    if (evento.key === CLAVE_CITAS) renderizarListado();
  });
  window.addEventListener("pageshow", (evento) => {
    if (evento.persisted && obtenerRol()) renderizarListado();
  });
}

if (obtenerRol()) {
  iniciarCitas().catch(() => {
    estadoListado.textContent = "No se pudieron cargar las citas. Verifica el servidor HTTP local y recarga.";
  });
}
