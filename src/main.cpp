#include "personaje.h"
#include "clase.h"
#include "cesar.h"
#include "leo1.h"
#include "leo2.h"
#include "profe.h"
#include <iostream>

int main() {
    Cesar   pCesar("Cesar");
    Leo1    pLeo1("Leo1");
    Leo2    pLeo2("Leo2");
    Profe   pProfe("Profe");

    Personaje* equipo[4];
    equipo[0] = &pCesar;
    equipo[1] = &pLeo1;
    equipo[2] = &pLeo2;
    equipo[3] = &pProfe;

    std::cout << "===== Roster =====" << std::endl;
    for (int i = 0; i < 4; i++) {
        equipo[i]->mostrar();
        std::cout << "-------------------" << std::endl;
    }


    return 0;
}
