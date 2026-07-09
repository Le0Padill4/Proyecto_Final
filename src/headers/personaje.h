#ifndef PERSONAJE_H
#define PERSONAJE_H

#include <iostream>

class Personaje {
protected:
    std::string nombre;
    int hp;
    int hpmax;
    int ki;
    int kimax;
    int ataque;
    int defensa;
    bool defiende;
    std::string nataque;
    std::string nataque_especial;
    int ki_especial;

public:
    Personaje(const std::string& nombre, int hpmax, int kimax, int ataque, int defensa);
    virtual ~Personaje();

    std::string getNombre() const;
    int getHp() const;
    int getHpMax() const;
    int getKi() const;
    int getKiMax() const;
    int getAtaque() const;
    int getDefensa() const;
    int getKiEspecial() const;
    bool getDefiende() const;
    std::string getNataque() const;
    std::string getNataqueEspecial() const;

    void setNombre(const std::string& nombre);
    void setHp(int hp);
    void setataque(int ataque);
    void setdefensa(int defensa);
    void setdefiende(bool valor);
    void setKi(int ki);
    void setKiEspecial(int ki_especial);
    void setNataque(const std::string& nataque);
    void setNataqueEspecial(const std::string& nataque_especial);
    virtual void atacarNormal(Personaje& objetivo);
    virtual void atacarEspecial(Personaje& objetivo);
    bool vive() const;
    void mostrar() const;
};

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

#endif