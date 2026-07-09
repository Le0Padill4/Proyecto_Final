#include "personaje.h"
#include "clase.h"
#include "Sexitar.h"
#include "leo1.h"
#include "leo2.h"
#include "François.h"
#include <iostream>

int main() {
    Sexitar   pSexitar("Sexitar");
    Leo1    pLeo1("Leo1");
    Leo2    pLeo2("Leo2");
    François   pFrançois("François");

    Personaje* equipo[4];
    equipo[0] = &pSexitar;
    equipo[1] = &pLeo1;
    equipo[2] = &pLeo2;
    equipo[3] = &pFrançois;

    std::cout << "===== Personajes =====" << std::endl;
    for (int i = 0; i < 4; i++) {
        equipo[i]->mostrar();
        std::cout << "-------------------" << std::endl;
    }


    return 0;
}
