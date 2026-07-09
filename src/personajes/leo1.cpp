#include "leo1.h"
#include <iostream>

//Constructor de la clase Leo1, que hereda de Personaje y establece los atributos específicos del personaje.
Leo1::Leo1(const std::string& nombreInicial) : Personaje(nombreInicial, 90, 110, 20, 8) {
    nataque = "G";
    nataque_especial = "R";
    ki_especial = 25;
}

void Leo1::atacarEspecial(Personaje& objetivo) {
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

    std::cout << nombre << " se mueve a toda velocidad y lanza " << nataque_especial
               << " contra " << objetivo.getNombre() << " (" << dano << " de dano)." << std::endl;
    objetivo.setHp(objetivo.getHp() - dano);
}
