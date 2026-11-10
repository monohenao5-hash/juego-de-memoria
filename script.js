"use strict";

/* ==========================================================
   1. DATOS DEL JUEGO
   ========================================================== */

// Ocho elementos diferentes (símbolos Unicode) con su color
const SIMBOLOS = [
  { simbolo: "🚀", color: "#ff5c8a" },
  { simbolo: "🌟", color: "#f5a623" },
  { simbolo: "🎮", color: "#7c5cff" },
  { simbolo: "🦊", color: "#ff7a2f" },
  { simbolo: "🍕", color: "#e84545" },
  { simbolo: "🎧", color: "#17b3b8" },
  { simbolo: "🐙", color: "#b44cf0" },
  { simbolo: "🏆", color: "#2bb673" }
];

const TOTAL_PAREJAS = SIMBOLOS.length;   // 8 parejas = 16 tarjetas
const TIEMPO_ESPERA = 900;               // milisegundos antes de ocultar un error

/* ==========================================================
   2. REFERENCIAS AL DOM
   ========================================================== */

const pantallaInicio = document.getElementById("pantalla-inicio");
const pantallaJuego = document.getElementById("pantalla-juego");
const tablero = document.getElementById("tablero");
const mensaje = document.getElementById("mensaje");
const contadorMovimientos = document.getElementById("contador-movimientos");
const contadorTiempo = document.getElementById("contador-tiempo");
const contadorParejas = document.getElementById("contador-parejas");
const modalVictoria = document.getElementById("modal-victoria");
const resultadoMovimientos = document.getElementById("resultado-movimientos");
const resultadoTiempo = document.getElementById("resultado-tiempo");
const estrellas = document.getElementById("estrellas");

const btnIniciar = document.getElementById("btn-iniciar");
const btnReiniciar = document.getElementById("btn-reiniciar");
const btnMenu = document.getElementById("btn-menu");
const btnJugarOtraVez = document.getElementById("btn-jugar-otra-vez");
const btnVolverInicio = document.getElementById("btn-volver-inicio");

/* ==========================================================
   3. ESTADO DEL JUEGO
   ========================================================== */

const estado = {
  primera: null,          // primera tarjeta seleccionada
  segunda: null,          // segunda tarjeta seleccionada
  bloqueado: false,       // impide seleccionar más de dos tarjetas
  movimientos: 0,
  parejas: 0,
  segundos: 0,
  juegoIniciado: false,   // se activa con el primer clic
  temporizador: null,     // identificador de setInterval
  esperaError: null,      // identificador de setTimeout (pareja incorrecta)
  esperaVictoria: null    // identificador de setTimeout (ventana de victoria)
};

/* ==========================================================
   4. FUNCIONES AUXILIARES
   ========================================================== */

// Mezcla un arreglo con el algoritmo Fisher-Yates y devuelve una copia
function mezclar(arreglo) {
  const copia = [...arreglo];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

// Convierte segundos a formato mm:ss
function formatearTiempo(totalSegundos) {
  const minutos = String(Math.floor(totalSegundos / 60)).padStart(2, "0");
  const segundos = String(totalSegundos % 60).padStart(2, "0");
  return `${minutos}:${segundos}`;
}

function mostrarMensaje(texto) {
  mensaje.textContent = texto;
}

function actualizarMarcadores() {
  contadorMovimientos.textContent = estado.movimientos;
  contadorTiempo.textContent = formatearTiempo(estado.segundos);
  contadorParejas.textContent = `${estado.parejas} / ${TOTAL_PAREJAS}`;
}

/* ==========================================================
   5. TEMPORIZADOR
   ========================================================== */

function iniciarTemporizador() {
  estado.juegoIniciado = true;
  estado.temporizador = setInterval(() => {
    estado.segundos++;
    contadorTiempo.textContent = formatearTiempo(estado.segundos);
  }, 1000);
}

function detenerTemporizador() {
  clearInterval(estado.temporizador);
  estado.temporizador = null;
}

/* ==========================================================
   6. CREACIÓN DEL TABLERO
   ========================================================== */

function crearBaraja() {
  // Cada símbolo se duplica para formar las parejas
  const duplicadas = [...SIMBOLOS, ...SIMBOLOS];
  return mezclar(duplicadas);
}

function crearTarjeta(datos, indice) {
  const tarjeta = document.createElement("button");
  tarjeta.type = "button";
  tarjeta.className = "tarjeta";
  tarjeta.dataset.simbolo = datos.simbolo;
  tarjeta.style.setProperty("--color-carta", datos.color);
  tarjeta.style.setProperty("--retraso", `${indice * 45}ms`);
  tarjeta.setAttribute("aria-label", "Tarjeta oculta");

  tarjeta.innerHTML =
    '<span class="tarjeta-interior">' +
      '<span class="cara cara-dorso">?</span>' +
      `<span class="cara cara-frente">${datos.simbolo}</span>` +
    "</span>";

  tarjeta.addEventListener("click", () => seleccionarTarjeta(tarjeta));
  return tarjeta;
}

function crearTablero() {
  tablero.innerHTML = "";
  crearBaraja().forEach((datos, indice) => {
    tablero.appendChild(crearTarjeta(datos, indice));
  });
}

/* ==========================================================
   7. LÓGICA DE SELECCIÓN Y COMPARACIÓN
   ========================================================== */

function voltearTarjeta(tarjeta) {
  tarjeta.classList.add("volteada");
  tarjeta.setAttribute("aria-label", `Tarjeta ${tarjeta.dataset.simbolo}`);
}

function ocultarTarjeta(tarjeta) {
  tarjeta.classList.remove("volteada", "error");
  tarjeta.setAttribute("aria-label", "Tarjeta oculta");
}

function seleccionarTarjeta(tarjeta) {
  // No se permiten más de dos tarjetas al mismo tiempo
  if (estado.bloqueado) return;

  // Ignora tarjetas ya giradas o ya emparejadas
  if (tarjeta.classList.contains("volteada")) return;

  // El tiempo comienza con el primer clic
  if (!estado.juegoIniciado) {
    iniciarTemporizador();
  }

  voltearTarjeta(tarjeta);

  // Primera tarjeta de la jugada
  if (estado.primera === null) {
    estado.primera = tarjeta;
    mostrarMensaje("Ahora busca su pareja.");
    return;
  }

  // Segunda tarjeta de la jugada
  estado.segunda = tarjeta;
  estado.bloqueado = true;
  estado.movimientos++;
  actualizarMarcadores();
  compararTarjetas();
}

function compararTarjetas() {
  const coinciden =
    estado.primera.dataset.simbolo === estado.segunda.dataset.simbolo;

  if (coinciden) {
    marcarPareja();
  } else {
    ocultarPareja();
  }
}

function marcarPareja() {
  [estado.primera, estado.segunda].forEach((tarjeta) => {
    tarjeta.classList.add("encontrada");
    tarjeta.disabled = true;
  });

  estado.parejas++;
  limpiarSeleccion();
  actualizarMarcadores();

  if (estado.parejas === TOTAL_PAREJAS) {
    ganarJuego();
  } else {
    mostrarMensaje("¡Pareja encontrada! Sigue así.");
  }
}

function ocultarPareja() {
  const a = estado.primera;
  const b = estado.segunda;

  a.classList.add("error");
  b.classList.add("error");
  mostrarMensaje("No coinciden. Memoriza su posición.");

  estado.esperaError = setTimeout(() => {
    ocultarTarjeta(a);
    ocultarTarjeta(b);
    limpiarSeleccion();
    estado.esperaError = null;
  }, TIEMPO_ESPERA);
}

function limpiarSeleccion() {
  estado.primera = null;
  estado.segunda = null;
  estado.bloqueado = false;
}

/* ==========================================================
   8. VICTORIA
   ========================================================== */

function calcularEstrellas(movimientos) {
  if (movimientos <= 12) return "⭐⭐⭐";
  if (movimientos <= 18) return "⭐⭐";
  return "⭐";
}

function ganarJuego() {
  detenerTemporizador();
  estado.bloqueado = true;
  mostrarMensaje("¡Completaste el tablero!");

  estado.esperaVictoria = setTimeout(() => {
    resultadoMovimientos.textContent = estado.movimientos;
    resultadoTiempo.textContent = formatearTiempo(estado.segundos);
    estrellas.textContent = calcularEstrellas(estado.movimientos);
    modalVictoria.classList.remove("oculto");
    estado.esperaVictoria = null;
  }, 700);
}

/* ==========================================================
   9. INICIO, REINICIO Y MENÚ
   ========================================================== */

// Cancela temporizadores y esperas pendientes
function detenerTodo() {
  detenerTemporizador();
  clearTimeout(estado.esperaError);
  clearTimeout(estado.esperaVictoria);
  estado.esperaError = null;
  estado.esperaVictoria = null;
}

function reiniciarJuego() {
  detenerTodo();

  estado.primera = null;
  estado.segunda = null;
  estado.bloqueado = false;
  estado.movimientos = 0;
  estado.parejas = 0;
  estado.segundos = 0;
  estado.juegoIniciado = false;

  modalVictoria.classList.add("oculto");
  crearTablero();
  actualizarMarcadores();
  mostrarMensaje("Haz clic en una tarjeta para comenzar.");
}

function iniciarJuego() {
  pantallaInicio.classList.add("oculto");
  pantallaJuego.classList.remove("oculto");
  reiniciarJuego();
}

function volverAlMenu() {
  detenerTodo();
  modalVictoria.classList.add("oculto");
  pantallaJuego.classList.add("oculto");
  pantallaInicio.classList.remove("oculto");
}

/* ==========================================================
   10. EVENTOS
   ========================================================== */

btnIniciar.addEventListener("click", iniciarJuego);
btnReiniciar.addEventListener("click", reiniciarJuego);
btnMenu.addEventListener("click", volverAlMenu);
btnJugarOtraVez.addEventListener("click", reiniciarJuego);
btnVolverInicio.addEventListener("click", volverAlMenu);
