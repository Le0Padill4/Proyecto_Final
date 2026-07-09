#include "Sexitar.h"
#include <iostream>
// Constructor de la clase Sexitar, que hereda de Personaje (nombre, hpmax, kimax, ataque, defensa)

Sexitar::Sexitar(const std::string& nombreInicial) : Personaje(nombreInicial, 120, 80, 18, 20) {
    nataque = "Hacer deberes en clases";
    nataque_especial = "Al Cesar lo que es del Cesar";
    ki_especial = 35;
}

void Sexitar::atacarEspecial(Personaje& objetivo) {
    if (ki < ki_especial) {
        std::cout << nombre << " no tiene suficiente Ki para " << nataque_especial << "." << std::endl;
        return;
    }
    ki = ki - ki_especial;

    int dano = (ataque * 2) - objetivo.getDefensa();
    if (dano < 1) {
        dano = 1;
    }
    if (objetivo.getDefiende()) {
        dano = dano / 2;
    }

    std::cout << nombre << " desata " << nataque_especial
               << " contra " << objetivo.getNombre() << " (" << dano << " de dano)." << std::endl;
    objetivo.setHp(objetivo.getHp() - dano);
}
