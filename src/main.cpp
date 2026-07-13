#include "personaje.h"
#include "clase.h"
#include "Sexitar.h"
#include "leo1.h"
#include "leo2.h"
#include "François.h"
#include "seleccion_personajes.h"
#include <iostream>
#include <limits>

int leerOpcion(int minimo, int maximo) {
    int opcion;

    while (true) {
        std::cout << "Elige una opcion (" << minimo << "-" << maximo << "): ";
        if (std::cin >> opcion && opcion >= minimo && opcion <= maximo) {
            return opcion;
        }

        std::cout << "Opcion invalida. Intenta de nuevo." << std::endl;
        std::cin.clear();
        std::cin.ignore(std::numeric_limits<std::streamsize>::max(), '\n');
    }
}

void mostrarPersonajes(Personaje* personajes[], int cantidad) {
    std::cout << "===== Personajes =====" << std::endl;
    for (int i = 0; i < cantidad; i++) {
        std::cout << i + 1 << ". ";
        personajes[i]->mostrar();
        std::cout << "-------------------" << std::endl;
    }
}

void mostrarEstado(Personaje& jugador1, Personaje& jugador2) {
    std::cout << "\n===== Estado del combate =====" << std::endl;
    std::cout << jugador1.getNombre() << " | Vida: " << jugador1.getHp() << "/"
              << jugador1.getHpMax() << " | Ki: " << jugador1.getKi() << "/"
              << jugador1.getKiMax() << std::endl;
    std::cout << jugador2.getNombre() << " | Vida: " << jugador2.getHp() << "/"
              << jugador2.getHpMax() << " | Ki: " << jugador2.getKi() << "/"
              << jugador2.getKiMax() << std::endl;
}

void ejecutarTurno(Personaje& atacante, Personaje& defensor) {
    atacante.setdefiende(false);

    std::cout << "\nTurno de " << atacante.getNombre() << std::endl;
    std::cout << "1. Ataque normal: " << atacante.getNataque() << std::endl;
    std::cout << "2. Ataque especial: " << atacante.getNataqueEspecial()
              << " (" << atacante.getKiEspecial() << " Ki)" << std::endl;
    std::cout << "3. Defender" << std::endl;

    int opcion = leerOpcion(1, 3);

    if (opcion == 1) {
        atacante.atacarNormal(defensor);
        atacante.setKi(atacante.getKi() + 15);
    } else if (opcion == 2) {
        atacante.atacarEspecial(defensor);
    } else {
        atacante.setdefiende(true);
        atacante.setKi(atacante.getKi() + 10);
        std::cout << atacante.getNombre() << " se prepara para defenderse." << std::endl;
    }
}

int main(int argc, char* argv[]) {
    Sexitar   pSexitar("Sexitar");
    Leo1    pLeo1("Leo1");
    Leo2    pLeo2("Leo2");
    François   pFrançois("François");

    Personaje* equipo[4];
    equipo[0] = &pSexitar;
    equipo[1] = &pFrançois;
    equipo[2] = &pLeo2;
    equipo[3] = &pLeo1;

    // Esta selección visual fue desarrollada con apoyo de IA y conserva
    // la selección por consola como alternativa si la interfaz no puede abrirse.
    const SeleccionJugadores seleccion = seleccionarPersonajesWeb(
        equipo,
        4,
        argc > 0 ? argv[0] : ""
    );

    int opcionJugador1;
    int opcionJugador2;
    if (seleccion.completada) {
        opcionJugador1 = seleccion.jugador1 + 1;
        opcionJugador2 = seleccion.jugador2 + 1;
        std::cout << "Seleccion confirmada desde la interfaz." << std::endl;
    } else {
        mostrarPersonajes(equipo, 4);

        std::cout << "Jugador 1, selecciona tu personaje." << std::endl;
        opcionJugador1 = leerOpcion(1, 4);

        std::cout << "Jugador 2, selecciona tu personaje." << std::endl;
        opcionJugador2 = leerOpcion(1, 4);

        while (opcionJugador2 == opcionJugador1) {
            std::cout << "Ese personaje ya fue elegido. Selecciona otro." << std::endl;
            opcionJugador2 = leerOpcion(1, 4);
        }
    }

    Personaje* jugador1 = equipo[opcionJugador1 - 1];
    Personaje* jugador2 = equipo[opcionJugador2 - 1];

    std::cout << "\n===== Combate por turnos =====" << std::endl;
    std::cout << jugador1->getNombre() << " vs " << jugador2->getNombre() << std::endl;

    int turno = 1;
    while (jugador1->vive() && jugador2->vive()) {
        mostrarEstado(*jugador1, *jugador2);

        if (turno % 2 == 1) {
            ejecutarTurno(*jugador1, *jugador2);
        } else {
            ejecutarTurno(*jugador2, *jugador1);
        }

        turno++;
    }

    mostrarEstado(*jugador1, *jugador2);
    if (jugador1->vive()) {
        std::cout << "\nGana " << jugador1->getNombre() << "." << std::endl;
    } else {
        std::cout << "\nGana " << jugador2->getNombre() << "." << std::endl;
    }

    return 0;
}
