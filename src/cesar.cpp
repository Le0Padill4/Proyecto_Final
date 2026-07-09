#include "cesar.h"
#include <iostream>

Cesar::Cesar(const std::string& nombreInicial) : Personaje(nombreInicial, 120, 80, 18, 14) {
    nataque = "E";
    nataque_especial = "F";
    ki_especial = 35;
}

void Cesar::atacarEspecial(Personaje& objetivo) {
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
