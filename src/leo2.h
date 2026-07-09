#ifndef LEO2_H
#define LEO2_H

#include "personaje.h"

class Leo2 : public Personaje {
public:
    Leo2(const std::string& nombre);
    void atacarEspecial(Personaje& objetivo) ;
};

#endif
