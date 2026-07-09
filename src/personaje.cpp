#include "personaje.h"
#include <iostream>
#include <algorithm>

Personaje::Personaje(const std::string& nombreInicial, int hpmaxInicial, int kimaxInicial, int ataqueInicial, int defensaInicial) {
    nombre = nombreInicial;

    if (hpmaxInicial < 1) {
        hpmax = 1;
    } else {
        hpmax = hpmaxInicial;
    }
    hp = hpmax;

    if (kimaxInicial < 0) {
        kimax = 0;
    } else {
        kimax = kimaxInicial;
    }
    ki = 0;

    if (ataqueInicial < 1) {
        ataque = 1;
    } else {
        ataque = ataqueInicial;
    }

    if (defensaInicial < 0) {
        defensa = 0;
    } else {
        defensa = defensaInicial;
    }

    defiende = false;

    nataque = "Golpe basico";
    nataque_especial = "Ataque especial";
    ki_especial = 20;
}

Personaje::~Personaje() {
}

std::string Personaje::getNombre() const {
    return nombre;
}

int Personaje::getHp() const {
    return hp;
}

int Personaje::getHpMax() const {
    return hpmax;
}

int Personaje::getKi() const {
    return ki;
}

int Personaje::getKiMax() const {
    return kimax;
}

int Personaje::getAtaque() const {
    return ataque;
}

int Personaje::getDefensa() const {
    return defensa;
}

int Personaje::getKiEspecial() const {
    return ki_especial;
}

bool Personaje::getDefiende() const {
    return defiende;
}

std::string Personaje::getNataque() const {
    return nataque;
}

std::string Personaje::getNataqueEspecial() const {
    return nataque_especial;
}

void Personaje::setNombre(const std::string& nuevoNombre) {
    nombre = nuevoNombre;
}

void Personaje::setHp(int nuevoHp) {
    if (nuevoHp < 0) {
        hp = 0;
    } else if (nuevoHp > hpmax) {
        hp = hpmax;
    } else {
        hp = nuevoHp;
    }
}

void Personaje::setataque(int nuevoAtaque) {
    if (nuevoAtaque >= 1) {
        ataque = nuevoAtaque;
    }
}

void Personaje::setdefensa(int nuevaDefensa) {
    if (nuevaDefensa >= 0) {
        defensa = nuevaDefensa;
    }
}

void Personaje::setKi(int nuevoKi) {
    if (nuevoKi < 0) {
        ki = 0;
    } else if (nuevoKi > kimax) {
        ki = kimax;
    } else {
        ki = nuevoKi;
    }
}

void Personaje::setdefiende(bool valor) {
    defiende = valor;
}

bool Personaje::vive() const {
    return hp > 0;
}

void Personaje::mostrar() const {
    std::cout << "Nombre: " << getNombre() << std::endl;
    std::cout << "Vida: " << getHp() << "/" << getHpMax() << std::endl;
    std::cout << "Ki: " << getKi() << "/" << getKiMax() << std::endl;
    std::cout << "Ataque: " << getAtaque() << std::endl;
    std::cout << "Defensa: " << getDefensa() << std::endl;
    if (getDefiende()) {
        std::cout << "Estado: Defendiendo" << std::endl;
    } else {
        std::cout << "Estado: Normal" << std::endl;
    }
}


void Personaje::atacarNormal(Personaje& objetivo) {
    int dano = ataque - (objetivo.getDefensa() / 2);
    if (dano < 1) {
        dano = 1;
    }
    if (objetivo.getDefiende()) {
        dano = dano / 2;
    }
    std::cout << nombre << " usa " << nataque << " contra " << objetivo.getNombre()
               << " (" << dano << " de dano)." << std::endl;
    objetivo.setHp(objetivo.getHp() - dano);
}

void Personaje::atacarEspecial(Personaje& objetivo) {
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
    std::cout << nombre << " usa " << nataque_especial << " contra " << objetivo.getNombre()
               << " (" << dano << " de dano)." << std::endl;
    objetivo.setHp(objetivo.getHp() - dano);
}