#include "profe.h"
#include <iostream>

Profe::Profe(const std::string& nombreInicial) : Personaje(nombreInicial, 150, 150, 22, 16) {
    nataque = "Polimorfismo";
    nataque_especial = "Herencia";
    ki_especial = 40;
}

void Profe::atacarNormal(Personaje& objetivo) {
    int dano = ataque - (objetivo.getDefensa() / 2);
    if (dano < 1) {
        dano = 1;
    }
    if (objetivo.getDefiende()) {
        dano = dano / 2;
    }
    std::cout << nombre << " marca un error con " << nataque
               << " contra " << objetivo.getNombre() << " (" << dano << " de dano)." << std::endl;
    objetivo.setHp(objetivo.getHp() - dano);
}

void Profe::atacarEspecial(Personaje& objetivo) {
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

    std::cout << nombre << " imparte " << nataque_especial
               << " contra " << objetivo.getNombre() << " (" << dano << " de dano)." << std::endl;
    objetivo.setHp(objetivo.getHp() - dano);
}