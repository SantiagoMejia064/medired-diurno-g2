import { obtenerRol } from "./sesion.js";

export const CLAVE_HISTORIAS = "medired.historias";

export function puedeGestionarHistorias() {
  return ["administrador", "medico"].includes(obtenerRol());
}

export function fechaLocalActual() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, "0");
  const dia = String(hoy.getDate()).padStart(2, "0");
  return `${hoy.getFullYear()}-${mes}-${dia}`;
}

async function cargarJSON(archivo) {
  const respuesta = await fetch(new URL(`../data/${archivo}.json`, import.meta.url));
  if (!respuesta.ok) throw new Error(`No se pudo cargar ${archivo}.`);
  return respuesta.json();
}

export async function cargarDatos() {
  const [pacientes, medicos, historiasIniciales] = await Promise.all([
    cargarJSON("pacientes"),
    cargarJSON("medicos"),
    cargarJSON("historias"),
  ]);
  return { pacientes, medicos, historiasIniciales };
}

function leerRegistro({ historiasIniciales }) {
  const guardado = localStorage.getItem(CLAVE_HISTORIAS);
  if (guardado !== null) return JSON.parse(guardado);
  const mayorId = historiasIniciales.reduce((mayor, historia) => Math.max(mayor, historia.id), 0);
  return { historias: historiasIniciales, siguienteId: mayorId + 1 };
}

export function leerHistorias(datos, pacienteId) {
  const { historias } = leerRegistro(datos);
  return pacienteId === null ? historias : historias.filter((historia) => historia.paciente_id === pacienteId);
}

function construirHistoria(historia, { pacientes, medicos }) {
  const paciente = pacientes.find(({ id }) => id === historia.paciente_id);
  const medico = medicos.find(({ id }) => id === historia.medico_id);
  if (!paciente || !medico) throw new Error("Selecciona un paciente y un médico registrados.");

  const fecha = new Date(`${historia.fecha}T00:00:00Z`);
  if (Number.isNaN(fecha.getTime()) || fecha.toISOString().slice(0, 10) !== historia.fecha) {
    throw new Error("Ingresa una fecha de atención válida.");
  }
  if (historia.fecha > fechaLocalActual()) {
    throw new Error("La fecha de la atención no puede ser futura.");
  }

  const motivoConsulta = historia.motivo_consulta.trim();
  const diagnostico = historia.diagnostico.trim();
  const tratamiento = historia.tratamiento.trim();
  if (!motivoConsulta || !diagnostico || !tratamiento) {
    throw new Error("Completa el motivo de consulta, el diagnóstico y el tratamiento.");
  }

  return {
    paciente_id: paciente.id,
    medico_id: medico.id,
    fecha: historia.fecha,
    motivo_consulta: motivoConsulta,
    diagnostico,
    tratamiento,
    paciente: { id: paciente.id, nombre: paciente.nombre },
    medico: { id: medico.id, nombre: medico.nombre, especialidad: medico.especialidad },
  };
}

async function actualizarRegistro(datos, cambiar) {
  const escribir = () => {
    if (!puedeGestionarHistorias()) throw new Error("Este rol solo puede consultar historias.");
    const registro = leerRegistro(datos);
    cambiar(registro);
    localStorage.setItem(CLAVE_HISTORIAS, JSON.stringify(registro));
  };

  if (navigator.locks) return navigator.locks.request(CLAVE_HISTORIAS, escribir);
  escribir();
}

export function guardarHistoria(datos, historia, id) {
  return actualizarRegistro(datos, (registro) => {
    const campos = construirHistoria(historia, datos);
    if (id === null) {
      registro.historias = [...registro.historias, { id: registro.siguienteId, ...campos }];
      registro.siguienteId += 1;
      return;
    }

    if (!registro.historias.some((actual) => actual.id === id)) {
      throw new Error("La historia ya no está disponible.");
    }
    registro.historias = registro.historias.map((actual) => actual.id === id ? { id, ...campos } : actual);
  });
}

export function eliminarHistoria(datos, id) {
  return actualizarRegistro(datos, (registro) => {
    const restantes = registro.historias.filter((historia) => historia.id !== id);
    if (restantes.length === registro.historias.length) {
      throw new Error("La historia ya no está disponible.");
    }
    registro.historias = restantes;
  });
}
