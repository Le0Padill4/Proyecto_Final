#ifndef LEO1_H
#define LEO1_H

#include "personaje.h"

class Leo1 : public Personaje {
public:
    Leo1(const std::string& nombre);
    void atacarEspecial(Personaje& objetivo) override;
};

#endif
