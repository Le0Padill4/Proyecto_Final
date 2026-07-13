#ifndef SELECCION_PERSONAJES_H
#define SELECCION_PERSONAJES_H

#include <string>

class Personaje;

struct SeleccionJugadores {
    int jugador1;
    int jugador2;
    bool completada;
};

// Esta interfaz visual fue desarrollada con apoyo de IA. El servidor conserva
// las instancias reales de los personajes durante la selección y el combate.
SeleccionJugadores seleccionarPersonajesWeb(
    Personaje* personajes[],
    int cantidad,
    const std::string& rutaEjecutable
);

#endif
