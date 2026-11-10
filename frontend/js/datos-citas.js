import { puedeGestionarCitas } from "./sesion.js";

export const SEDES = ["Cali", "Bogotá", "Medellín"];
export const ESTADOS = {
  programada: "Programada",
  atendida: "Atendida",
  cancelada: "Cancelada",
};
export const CLAVE_CITAS = "medired.citas";

async function cargarJSON(archivo) {
  const respuesta = await fetch(new URL(`../data/${archivo}.json`, import.meta.url));
  if (!respuesta.ok) throw new Error("No se pudo cargar " + archivo);
  return respuesta.json();
}

export async function cargarDatos() {
  const [pacientes, medicos, citasIniciales] = await Promise.all([
    cargarJSON("pacientes"),
    cargarJSON("medicos"),
    cargarJSON("citas"),
  ]);
  return { pacientes, medicos, citasIniciales };
}

function leerAgenda({ citasIniciales }) {
  const guardadas = localStorage.getItem(CLAVE_CITAS);
  if (guardadas !== null) return JSON.parse(guardadas);
  const mayorId = citasIniciales.reduce((mayor, cita) => Math.max(mayor, cita.id), 0);
  return { citas: citasIniciales, siguienteId: mayorId + 1 };
}

export function leerCitas(datos) {
  return leerAgenda(datos).citas;
}

function validarCita(cita, { pacientes, medicos }, citas, id) {
  if (!pacientes.some((paciente) => paciente.id === cita.paciente_id)) {
    throw new Error("Selecciona un paciente registrado.");
  }
  if (!medicos.some((medico) => medico.id === cita.medico_id)) {
    throw new Error("Selecciona un médico registrado.");
  }
  if (!SEDES.includes(cita.sede) || !Object.hasOwn(ESTADOS, cita.estado)) {
    throw new Error("Selecciona una sede y un estado válidos.");
  }

  const partes = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(cita.fecha_hora);
  if (!partes) throw new Error("Ingresa una fecha y hora válidas.");

  const [anio, mes, dia, hora, minuto] = partes.slice(1).map(Number);
  const fecha = new Date(anio, mes - 1, dia, hora, minuto);
  if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes - 1 ||
      fecha.getDate() !== dia || fecha.getHours() !== hora || fecha.getMinutes() !== minuto) {
    throw new Error("Ingresa una fecha y hora válidas.");
  }
  if (fecha.getTime() <= Date.now()) {
    throw new Error("La fecha y hora deben ser futuras.");
  }

  const conflicto = cita.estado !== "cancelada" && citas.some((otra) =>
    otra.id !== id && otra.medico_id === cita.medico_id &&
    otra.fecha_hora === cita.fecha_hora && otra.estado !== "cancelada"
  );
  if (conflicto) throw new Error("El médico ya tiene una cita en esa fecha y hora.");
}

async function actualizarCitas(datos, cambiar) {
  const escribir = () => {
    if (!puedeGestionarCitas()) throw new Error("Este rol solo puede consultar citas.");
    const agenda = leerAgenda(datos);
    cambiar(agenda);
    localStorage.setItem(CLAVE_CITAS, JSON.stringify(agenda));
  };

  // Serializa la lectura y escritura entre pestañas cuando el navegador lo permite.
  if (navigator.locks) return navigator.locks.request(CLAVE_CITAS, escribir);
  escribir();
}

export function guardarCita(datos, cita, id) {
  return actualizarCitas(datos, (agenda) => {
    const { citas } = agenda;
    if (id !== null && !citas.some((actual) => actual.id === id)) {
      throw new Error("La cita ya no está disponible.");
    }
    validarCita(cita, datos, citas, id);

    if (id === null) {
      agenda.citas = [...citas, { id: agenda.siguienteId, ...cita }];
      agenda.siguienteId += 1;
    } else {
      agenda.citas = citas.map((actual) => actual.id === id ? { id, ...cita } : actual);
    }
  });
}

export function eliminarCita(datos, id) {
  return actualizarCitas(datos, (agenda) => {
    agenda.citas = agenda.citas.filter((cita) => cita.id !== id);
  });
}
