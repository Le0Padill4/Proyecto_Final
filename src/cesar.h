#ifndef CESAR_H
#define CESAR_H

#include "personaje.h"

class Cesar : public Personaje {
public:
    Cesar(const std::string& nombre);
    void atacarEspecial(Personaje& objetivo) ;
};

#endif
