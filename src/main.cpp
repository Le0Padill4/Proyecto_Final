#include <iostream>
#include "personaje.h"
int main() {
    Personaje profe("Franzua", 100, 100, 15, 15);
    Personaje Leo_1("Leo_1", 100, 100, 15, 15);
    Personaje Sexitar("Sexitar", 100, 100, 15, 15);
    Personaje Leo_2("Leo_2", 100, 100, 15, 15);
    std::cout << "=== PERSONAJES CREADOS ===" << std::endl;
    profe.mostrar();
    Leo_1.mostrar();
    Sexitar.mostrar();
    Leo_2.mostrar();
    return 0;
}
