import { obtenerRol } from "./sesion.js";

const filas = document.querySelector("#filas-medicos");
const tabla = document.querySelector(".tabla-contenedor");
const estadoListado = document.querySelector("#estado-listado");
const detalle = document.querySelector("#detalle");
const datosDetalle = document.querySelector("#datos-detalle");
const nuevoMedico = document.querySelector("#nuevo-medico");

const editor = document.querySelector("#editor");
const formulario = document.querySelector("#formulario-medico");
const errorEditor = document.querySelector("#error-editor");
const aviso = document.querySelector("#aviso");

const CLAVE_MEDICOS = "medired.medicos";

const puedeGestionar = obtenerRol() === "administrador";

let medicos = [];
let idEnEdicion = null;


// Crea una celda de la tabla
function agregarCelda(fila, texto) {
  const celda = fila.insertCell();
  celda.textContent = texto;
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


// Muestra los detalles de un médico
function mostrarDetalle(medico) {
  const campos = [
    ["Nombre", medico.nombre],
    ["Registro médico", medico.registro_medico],
    ["Especialidad", medico.especialidad],
    ["Sede", medico.sede],
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


// Guarda los médicos modificados en localStorage
function guardarDatos() {
  localStorage.setItem(CLAVE_MEDICOS, JSON.stringify(medicos));
}


// Abre el formulario para crear o editar
function abrirEditor(medico = null) {
  if (!puedeGestionar) return;

  idEnEdicion = medico?.id ?? null;

  formulario.reset();
  errorEditor.textContent = "";

  document.querySelector("#titulo-editor").textContent =
    medico ? "Editar médico" : "Nuevo médico";

  if (medico) {
    for (const campo of [
      "nombre",
      "registro_medico",
      "especialidad",
      "sede",
    ]) {
      formulario.elements[campo].value = medico[campo];
    }
  }

  editor.showModal();
}


// Elimina un médico
function eliminarMedico(medico) {
  if (!puedeGestionar) return;

  const confirmar = window.confirm(
    `¿Eliminar al médico ${medico.nombre}?`
  );

  if (!confirmar) return;

  medicos = medicos.filter(
    (registro) => registro.id !== medico.id
  );

  guardarDatos();
  renderizarListado();

  aviso.textContent = "Médico eliminado.";
}


// Guarda o actualiza un médico
function guardarMedico(evento) {
  evento.preventDefault();

  if (!puedeGestionar) return;

  const datos = new FormData(formulario);

  const medico = {
    nombre: String(datos.get("nombre")).trim(),
    registro_medico: String(datos.get("registro_medico")).trim(),
    especialidad: String(datos.get("especialidad")).trim(),
    sede: String(datos.get("sede")).trim(),
  };

  if (
    !medico.nombre ||
    !medico.registro_medico ||
    !medico.especialidad ||
    !medico.sede
  ) {
    errorEditor.textContent =
      "Todos los campos son obligatorios.";
    return;
  }

  if (!["Cali", "Bogotá", "Medellín"].includes(medico.sede)) {
    errorEditor.textContent =
      "Selecciona una sede válida.";
    return;
  }

  const duplicado = medicos.some(
    (registro) =>
      registro.registro_medico.toLowerCase() ===
        medico.registro_medico.toLowerCase() &&
      registro.id !== idEnEdicion
  );

  if (duplicado) {
    errorEditor.textContent =
      "El registro médico ya existe.";
    return;
  }

  if (idEnEdicion === null) {
    const nuevoId =
      Math.max(
        0,
        ...medicos.map((registro) => registro.id)
      ) + 1;

    medicos.push({
      id: nuevoId,
      ...medico,
    });

    aviso.textContent = "Médico creado.";
  } else {
    medicos = medicos.map((registro) =>
      registro.id === idEnEdicion
        ? {
            id: registro.id,
            ...medico,
          }
        : registro
    );

    aviso.textContent = "Médico actualizado.";
  }

  guardarDatos();
  renderizarListado();

  editor.close();
}


// Muestra los médicos en la tabla
function renderizarListado() {
  const contenido = document.createDocumentFragment();

  for (const medico of medicos) {
    const fila = document.createElement("tr");

    agregarCelda(fila, medico.nombre);
    agregarCelda(fila, medico.registro_medico);
    agregarCelda(fila, medico.especialidad);
    agregarCelda(fila, medico.sede);

    const acciones = document.createElement("div");
    acciones.className = "acciones";

    acciones.append(
      crearAccion(
        "Ver detalle",
        () => mostrarDetalle(medico)
      )
    );

    if (puedeGestionar) {
      acciones.append(
        crearAccion(
          "Editar",
          () => abrirEditor(medico)
        ),
        crearAccion(
          "Eliminar",
          () => eliminarMedico(medico),
          "peligro"
        )
      );
    }

    fila.insertCell().append(acciones);
    contenido.append(fila);
  }

  filas.replaceChildren(contenido);

  tabla.hidden = medicos.length === 0;

  estadoListado.hidden = medicos.length > 0;
  estadoListado.textContent =
    "No hay médicos registrados.";

  nuevoMedico.hidden = !puedeGestionar;

  document.querySelector("#modo-consulta").hidden =
    puedeGestionar;
}


// Carga los datos iniciales
async function iniciarMedicos() {
  const respuesta = await fetch("data/medicos.json");

  if (!respuesta.ok) {
    throw new Error(
      "No se pudo cargar medicos.json"
    );
  }

  const iniciales = await respuesta.json();

  const guardados =
    localStorage.getItem(CLAVE_MEDICOS);

  medicos =
    guardados === null
      ? iniciales
      : JSON.parse(guardados);

  renderizarListado();

  nuevoMedico.addEventListener(
    "click",
    () => abrirEditor()
  );

  document
    .querySelector("#cancelar-editor")
    .addEventListener(
      "click",
      () => editor.close()
    );

  formulario.addEventListener(
    "submit",
    guardarMedico
  );

  window.addEventListener(
    "storage",
    (evento) => {
      if (evento.key !== CLAVE_MEDICOS) return;

      medicos =
        evento.newValue === null
          ? iniciales
          : JSON.parse(evento.newValue);

      renderizarListado();
    }
  );
}


// Inicia médicos si existe una sesión válida
if (obtenerRol()) {
  iniciarMedicos().catch((error) => {
    console.error(error);

    estadoListado.textContent =
      "No se pudieron cargar los médicos. Verifica el servidor HTTP local y recarga.";
  });
}