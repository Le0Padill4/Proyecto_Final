#ifndef PROFE_H
#define PROFE_H

#include "personaje.h"

class Profe : public Personaje {
public:
    Profe(const std::string& nombre);
    void atacarNormal(Personaje& objetivo) ;
    void atacarEspecial(Personaje& objetivo);
};

#endif
