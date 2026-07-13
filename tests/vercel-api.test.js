const assert = require("node:assert/strict");
const test = require("node:test");

const {
    createInitialState,
    decodeState,
    encodeState,
    handleGameRequest,
} = require("../api/game");

function request(method, route, state, body) {
    const result = handleGameRequest(method, route, state, body);
    assert.equal(result.status, 200, result.payload.message);
    return result;
}

test("mantiene una partida completa dentro del estado serializado de la sesión", () => {
    let state = createInitialState();
    let result = request("POST", "seleccion", state, { characterId: "personaje-1" });
    state = result.state;
    assert.deepEqual(result.payload, {
        status: "next",
        nextPlayer: 2,
        unavailableId: "personaje-1",
    });

    result = request("POST", "seleccion", state, { characterId: "personaje-2" });
    state = result.state;
    assert.equal(result.payload.status, "battle");
    assert.equal(result.payload.players[0].name, "Sexitar");
    assert.equal(result.payload.players[1].name, "François");

    result = request("POST", "combate/accion", state, { action: "normal" });
    state = result.state;
    assert.equal(result.payload.pendingImpact, true);
    assert.equal(result.payload.moveName, "Hacer deberes en clases");

    result = request("POST", "combate/impacto", state);
    state = result.state;
    assert.equal(result.payload.pendingImpact, false);
    assert.equal(result.payload.turn, 2);
    assert.equal(result.payload.players[1].hp, 140);
    assert.equal(result.payload.players[0].ki, 15);

    const restored = decodeState(`otra=1; proyecto_final_game=${encodeState(state)}`);
    assert.deepEqual(restored, state);
});

test("aplica defensa, carga de KI y rechazo de selecciones repetidas", () => {
    let state = createInitialState();
    state = request("POST", "seleccion", state, { characterId: "personaje-3" }).state;
    const duplicate = handleGameRequest("POST", "seleccion", state, {
        characterId: "personaje-3",
    });
    assert.equal(duplicate.status, 400);

    state = request("POST", "seleccion", state, { characterId: "personaje-4" }).state;
    let result = request("POST", "combate/accion", state, { action: "defend" });
    state = result.state;
    assert.equal(result.payload.turn, 2);
    assert.equal(result.payload.players[0].defending, true);
    assert.equal(result.payload.players[0].ki, 10);

    result = request("POST", "combate/accion", state, { action: "charge" });
    state = result.state;
    assert.equal(result.payload.turn, 1);
    assert.equal(result.payload.players[1].ki, 25);
    assert.equal(result.payload.players[0].defending, false);
});
