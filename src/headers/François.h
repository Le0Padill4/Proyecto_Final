#ifndef FRANÇOIS_H
#define FRANÇOIS_H

#include "personaje.h"

class François : public Personaje {
public:
    François(const std::string& nombre);
    void atacarNormal(Personaje& objetivo) ;
    void atacarEspecial(Personaje& objetivo);
};

#endif
