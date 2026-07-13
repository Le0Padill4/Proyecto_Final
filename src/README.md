# Proyecto Final

Juego de combate por turnos desarrollado en C++17.

## Compilación

```bash
cmake -S .. -B ../build
cmake --build ../build
```

Desde la raíz del repositorio, los comandos equivalentes son:

```bash
cmake -S . -B build
cmake --build build
./build/juego
```

En Windows, el ejecutable generado será `build/juego.exe`.

## Pruebas

El contrato del catálogo de animaciones y de los sprites de batalla se valida
sin dependencias adicionales con el runner incluido en Node.js:

```bash
node --test tests/battle-contract.test.js
```

## Interfaz visual

Al iniciar, el juego levanta un servidor únicamente en `127.0.0.1` y abre la
pantalla de selección en el navegador. El jugador 1 confirma un personaje y el
jugador 2 debe elegir uno distinto. Al confirmar el segundo personaje, la misma
página cambia a la arena de combate.

El menú admite mouse, flechas, Enter y barra espaciadora. Los ataques, la vida,
el KI y la defensa se ejecutan directamente sobre las instancias `Personaje` de
C++; el navegador solamente presenta el estado y envía las acciones. La acción
de cargar KI recupera hasta 25 puntos de energía y consume el turno.

Cada respuesta de combate incluye el nombre real del movimiento ejecutado. La
arena usa ese nombre para seleccionar su animación: los ocho ataques actuales
tienen una variante propia y los movimientos nuevos se clasifican por golpe,
patada, fuego, electricidad, KI, hielo, defensa o curación. Si el sistema tiene
activada la preferencia de movimiento reducido, conserva la señal visual sin
desplazamientos intensos.

Los retratos del selector se mantienen separados de los sprites de batalla. En
la arena, el jugador 1 usa automáticamente la variante trasera y el rival la
variante frontal. Las rutas se exponen como `imageSelect`, `imageBattleFront` e
`imageBattleBack` en el estado JSON.

Los ataques ofensivos se preparan primero y se confirman en el endpoint de
impacto, por lo que la vida cambia cuando la animación alcanza al objetivo. Al
terminar, `Volver a jugar` conserva los combatientes y restaura vida, KI,
defensa, turno, mensajes y efectos; `Volver a selección` limpia la partida y
habilita de nuevo los cuatro personajes.

Si el navegador no se abre automáticamente, se puede copiar la dirección local
que aparece en la consola. Si el servidor visual no puede iniciarse, el juego
conserva la selección y el combate por consola como alternativa.

La interfaz visual y los retratos pixel art fueron desarrollados con apoyo de
IA.
