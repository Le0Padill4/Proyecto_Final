#include "leo2.h"
#include <iostream>

//Constructor de la clase Leo2, que hereda de Personaje y establece los atributos específicos del personaje.
Leo2::Leo2(const std::string& nombreInicial) : Personaje(nombreInicial, 95, 100, 17, 11) {
    nataque = "P";
    nataque_especial = "O";
    ki_especial = 30;
}

void Leo2::atacarEspecial(Personaje& objetivo) {
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

    std::cout << nombre << " libera " << nataque_especial
               << " contra " << objetivo.getNombre() << " (" << dano << " de dano)." << std::endl;
    objetivo.setHp(objetivo.getHp() - dano);
}