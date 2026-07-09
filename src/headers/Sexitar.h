#ifndef CESAR_H
#define CESAR_H

#include "personaje.h"

class Sexitar : public Personaje {
public:
    Sexitar(const std::string& nombre);
    void atacarEspecial(Personaje& objetivo) ;
};

#endif
