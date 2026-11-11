import { obtenerRol } from "./sesion.js";
import {
  CLAVE_HISTORIAS, cargarDatos, eliminarHistoria, fechaLocalActual,
  guardarHistoria, leerHistorias, puedeGestionarHistorias,
} from "./datos-historias.js";

const nuevaHistoria = document.querySelector("#nueva-historia");
const filtroPaciente = document.querySelector("#filtro-paciente");
const filas = document.querySelector("#filas-historias");
const tabla = document.querySelector(".tabla-contenedor");
const estadoListado = document.querySelector("#estado-listado");
const aviso = document.querySelector("#aviso");
const editor = document.querySelector("#editor");
const formulario = document.querySelector("#formulario-historia");
const tituloEditor = document.querySelector("#titulo-editor");
const errorEditor = document.querySelector("#error-editor");
const detalle = document.querySelector("#detalle");
const datosDetalle = document.querySelector("#datos-detalle");
const formatoFecha = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "UTC" });

function formatearFecha(fecha) {
  return formatoFecha.format(new Date(`${fecha}T00:00:00Z`));
}

function crearAccion(texto, ejecutar, clase = "") {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = `accion ${clase}`;
  boton.textContent = texto;
  boton.addEventListener("click", ejecutar);
  return boton;
}

function mostrarDetalle(historia) {
  const campos = [
    ["Fecha", formatearFecha(historia.fecha)],
    ["Paciente", historia.paciente?.nombre ?? "Paciente no disponible"],
    ["Médico", historia.medico?.nombre ?? "Médico no disponible"],
    ["Especialidad", historia.medico?.especialidad ?? "—"],
    ["Motivo de consulta", historia.motivo_consulta],
    ["Diagnóstico", historia.diagnostico],
    ["Tratamiento", historia.tratamiento],
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

async function iniciarHistorias() {
  const datos = await cargarDatos();
  let idEnEdicion = null;

  for (const { id, nombre } of datos.pacientes) {
    filtroPaciente.add(new Option(nombre, id));
    formulario.elements.paciente_id.add(new Option(nombre, id));
  }
  for (const { id, nombre, especialidad } of datos.medicos) {
    formulario.elements.medico_id.add(new Option(`${nombre} · ${especialidad}`, id));
  }
  filtroPaciente.disabled = false;

  function abrirEditor(historia) {
    if (!puedeGestionarHistorias()) return;
    idEnEdicion = historia?.id ?? null;
    formulario.reset();
    formulario.elements.fecha.max = fechaLocalActual();
    errorEditor.textContent = "";
    tituloEditor.textContent = historia ? "Editar historia" : "Nueva historia";
    if (historia) {
      for (const campo of formulario.elements) {
        if (campo.name) campo.value = historia[campo.name];
      }
    } else if (filtroPaciente.value) {
      formulario.elements.paciente_id.value = filtroPaciente.value;
    }
    editor.showModal();
  }

  async function confirmarEliminacion(historia) {
    if (!puedeGestionarHistorias()) return;
    if (!window.confirm(`¿Eliminar la atención del ${formatearFecha(historia.fecha)}?`)) return;

    try {
      await eliminarHistoria(datos, historia.id);
      renderizarListado();
      nuevaHistoria.focus();
      aviso.textContent = "Historia eliminada.";
    } catch (error) {
      aviso.textContent = error.message;
    }
  }

  function renderizarListado() {
    const pacienteId = filtroPaciente.value ? Number(filtroPaciente.value) : null;
    const historias = [...leerHistorias(datos, pacienteId)].sort((a, b) =>
      b.fecha.localeCompare(a.fecha) || b.id - a.id);
    const puedeEditar = puedeGestionarHistorias();
    const contenido = document.createDocumentFragment();

    for (const historia of historias) {
      const fila = document.createElement("tr");
      fila.insertCell().textContent = formatearFecha(historia.fecha);
      fila.insertCell().textContent = historia.paciente?.nombre ?? "Paciente no disponible";
      fila.insertCell().textContent = historia.medico?.nombre ?? "Médico no disponible";

      const acciones = document.createElement("div");
      acciones.className = "acciones";
      acciones.append(crearAccion("Ver detalle", () => mostrarDetalle(historia)));
      if (puedeEditar) {
        acciones.append(
          crearAccion("Editar", () => abrirEditor(historia)),
          crearAccion("Eliminar", () => confirmarEliminacion(historia), "peligro"),
        );
      }
      fila.insertCell().append(acciones);
      contenido.append(fila);
    }

    filas.replaceChildren(contenido);
    tabla.hidden = historias.length === 0;
    estadoListado.hidden = historias.length > 0;
    estadoListado.textContent = pacienteId === null ? "No hay historias registradas." : "Este paciente aún no tiene historias registradas.";
    nuevaHistoria.hidden = !puedeEditar;
    document.querySelector("#modo-consulta").hidden = puedeEditar;
  }

  renderizarListado();
  filtroPaciente.addEventListener("change", renderizarListado);
  nuevaHistoria.addEventListener("click", () => abrirEditor());
  document.querySelector("#cancelar-editor").addEventListener("click", () => editor.close());
  formulario.addEventListener("submit", async (evento) => {
    evento.preventDefault();
    const campos = new FormData(formulario);
    const historia = {
      paciente_id: Number(campos.get("paciente_id")),
      medico_id: Number(campos.get("medico_id")),
      fecha: campos.get("fecha"),
      motivo_consulta: campos.get("motivo_consulta"),
      diagnostico: campos.get("diagnostico"),
      tratamiento: campos.get("tratamiento"),
    };

    const submit = evento.submitter;
    if (submit) submit.disabled = true;
    errorEditor.textContent = "";
    try {
      await guardarHistoria(datos, historia, idEnEdicion);
      if (filtroPaciente.value && Number(filtroPaciente.value) !== historia.paciente_id) {
        filtroPaciente.value = "";
      }
      editor.close();
      renderizarListado();
      nuevaHistoria.focus();
      aviso.textContent = idEnEdicion === null ? "Historia creada." : "Historia actualizada.";
    } catch (error) {
      errorEditor.textContent = error.message;
    } finally {
      if (submit) submit.disabled = false;
    }
  });

  window.addEventListener("storage", (evento) => {
    if (evento.key === CLAVE_HISTORIAS || evento.key === null) renderizarListado();
  });
  window.addEventListener("pageshow", (evento) => {
    if (evento.persisted && obtenerRol()) renderizarListado();
  });
}

if (obtenerRol()) {
  iniciarHistorias().catch(() => {
    estadoListado.textContent = "No se pudieron cargar las historias. Verifica el servidor local y recarga la página.";
  });
}
