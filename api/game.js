const CHARACTER_CATALOG = Object.freeze({
    "personaje-1": {
        name: "Sexitar",
        hpMax: 120,
        kiMax: 80,
        attack: 18,
        defense: 20,
        normalAttack: "Hacer deberes en clases",
        specialAttack: "Al Cesar lo que es del Cesar",
        specialCost: 35,
    },
    "personaje-2": {
        name: "François",
        hpMax: 150,
        kiMax: 150,
        attack: 22,
        defense: 16,
        normalAttack: "Deberes",
        specialAttack: "Herencia",
        specialCost: 40,
    },
    "personaje-3": {
        name: "Leo2",
        hpMax: 95,
        kiMax: 100,
        attack: 17,
        defense: 11,
        normalAttack: "Llegar tarde",
        specialAttack: "Llegar temprano",
        specialCost: 30,
    },
    "personaje-4": {
        name: "Leo1",
        hpMax: 90,
        kiMax: 110,
        attack: 20,
        defense: 8,
        normalAttack: "Crucigrama en clase",
        specialAttack: "Profe soy becado",
        specialCost: 25,
    },
});

const CHARGE_AMOUNT = 25;
const COOKIE_NAME = "proyecto_final_game";

function createInitialState() {
    return {
        selected: [],
        fighters: [],
        turn: 0,
        pending: null,
        visual: {
            effect: "entrada",
            moveName: "",
            actor: 1,
            target: 2,
            revision: 0,
            pendingImpact: false,
            messages: [],
        },
    };
}

function createFighter(id) {
    const character = CHARACTER_CATALOG[id];
    return { id, hp: character.hpMax, ki: 0, defending: false };
}

function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
}

function estimatedDamage(attacker, defender, special = false) {
    const attackerStats = CHARACTER_CATALOG[attacker.id];
    const defenderStats = CHARACTER_CATALOG[defender.id];
    let damage = special
        ? (attackerStats.attack * 2) - defenderStats.defense
        : attackerStats.attack - Math.trunc(defenderStats.defense / 2);
    damage = Math.max(1, damage);
    return defender.defending ? Math.trunc(damage / 2) : damage;
}

function fighterView(fighter, slot, opponent) {
    const character = CHARACTER_CATALOG[fighter.id];
    return {
        slot,
        id: fighter.id,
        name: character.name,
        image: `/assets/personajes/${fighter.id}.png`,
        imageSelect: `/assets/personajes/${fighter.id}.png`,
        imageBattleFront: `/assets/personajes/battle/${fighter.id}-front.png`,
        imageBattleBack: `/assets/personajes/battle/${fighter.id}-back.png`,
        hp: fighter.hp,
        hpMax: character.hpMax,
        ki: fighter.ki,
        kiMax: character.kiMax,
        defending: fighter.defending,
        defeated: fighter.hp <= 0,
        normalAttack: character.normalAttack,
        normalDamage: estimatedDamage(fighter, opponent),
        specialAttack: character.specialAttack,
        specialDamage: estimatedDamage(fighter, opponent, true),
        specialCost: character.specialCost,
    };
}

function battleView(state) {
    const [player1, player2] = state.fighters;
    const finished = player1.hp <= 0 || player2.hp <= 0;
    return {
        status: finished ? "finished" : "battle",
        turn: state.turn + 1,
        winner: finished ? (player1.hp > 0 ? 1 : 2) : null,
        chargeAmount: CHARGE_AMOUNT,
        revision: state.visual.revision,
        pendingImpact: state.visual.pendingImpact,
        effect: state.visual.effect,
        moveName: state.visual.moveName,
        actor: state.visual.actor,
        target: state.visual.target,
        messages: state.visual.messages,
        players: [
            fighterView(player1, 1, player2),
            fighterView(player2, 2, player1),
        ],
    };
}

function selectionView(state) {
    return {
        status: "selecting",
        player: state.selected.length + 1,
        unavailableId: state.selected[0] || null,
    };
}

function prepareBattle(state, rematch = false) {
    const nextRevision = rematch ? state.visual.revision + 1 : 0;
    state.fighters = state.selected.map(createFighter);
    state.turn = 0;
    state.pending = null;
    const [player1, player2] = state.fighters.map((fighter) => CHARACTER_CATALOG[fighter.id]);
    state.visual = {
        effect: "entrada",
        moveName: "",
        actor: 1,
        target: 2,
        revision: nextRevision,
        pendingImpact: false,
        messages: rematch
            ? [
                `¡Revancha: ${player1.name} contra ${player2.name}!`,
                "Vida, KI y estados restaurados.",
                `¿Qué hará ${player1.name}?`,
            ]
            : [`¡${player1.name} contra ${player2.name}!`, `¿Qué hará ${player1.name}?`],
    };
}

function error(status, message, state) {
    return { status, payload: { status: "error", message }, state };
}

function applySelection(state, characterId) {
    if (!CHARACTER_CATALOG[characterId] || state.selected.length >= 2 ||
        state.selected.includes(characterId)) {
        return error(400, "Selección no válida", state);
    }

    state.selected.push(characterId);
    if (state.selected.length === 1) {
        return {
            status: 200,
            payload: { status: "next", nextPlayer: 2, unavailableId: characterId },
            state,
        };
    }

    prepareBattle(state);
    return { status: 200, payload: battleView(state), state };
}

function applyAction(state, action) {
    if (state.selected.length !== 2 || state.fighters.length !== 2) {
        return error(409, "Completa primero la selección", state);
    }
    if (state.pending) return error(409, "Hay un impacto pendiente", state);
    if (state.fighters.some((fighter) => fighter.hp <= 0)) {
        return error(409, "La batalla ya terminó", state);
    }

    const attacker = state.fighters[state.turn];
    const attackerStats = CHARACTER_CATALOG[attacker.id];
    let consumesTurn = false;
    state.visual.actor = state.turn + 1;
    state.visual.target = (1 - state.turn) + 1;
    state.visual.moveName = "";
    state.visual.messages = [];
    state.visual.pendingImpact = false;

    if (action === "normal") {
        attacker.defending = false;
        state.visual.effect = "normal";
        state.visual.moveName = attackerStats.normalAttack;
        state.visual.messages = [`${attackerStats.name} utilizó ${attackerStats.normalAttack}.`];
        state.visual.pendingImpact = true;
        state.pending = { action, turn: state.turn };
    } else if (action === "special") {
        attacker.defending = false;
        if (attacker.ki < attackerStats.specialCost) {
            state.visual.effect = "sin-ki";
            state.visual.messages = [
                `No tienes suficiente KI para ${attackerStats.specialAttack}.`,
                `¿Qué hará ${attackerStats.name}?`,
            ];
        } else {
            state.visual.effect = "especial";
            state.visual.moveName = attackerStats.specialAttack;
            state.visual.messages = [`${attackerStats.name} utilizó ${attackerStats.specialAttack}.`];
            state.visual.pendingImpact = true;
            state.pending = { action, turn: state.turn };
        }
    } else if (action === "defend") {
        attacker.defending = true;
        attacker.ki = clamp(attacker.ki + 10, 0, attackerStats.kiMax);
        state.visual.effect = "defensa";
        state.visual.moveName = "Defender";
        state.visual.target = state.turn + 1;
        state.visual.messages = [
            `${attackerStats.name} se está defendiendo.`,
            `El próximo golpe contra ${attackerStats.name} hará menos daño.`,
        ];
        consumesTurn = true;
    } else if (action === "charge") {
        attacker.defending = false;
        const previousKi = attacker.ki;
        attacker.ki = clamp(attacker.ki + CHARGE_AMOUNT, 0, attackerStats.kiMax);
        const recoveredKi = attacker.ki - previousKi;
        state.visual.target = state.turn + 1;
        if (recoveredKi === 0) {
            state.visual.effect = "ki-maximo";
            state.visual.messages = [
                `El KI de ${attackerStats.name} ya está al máximo.`,
                `¿Qué hará ${attackerStats.name}?`,
            ];
        } else {
            state.visual.effect = "carga-ki";
            state.visual.moveName = "Cargar KI";
            state.visual.messages = [
                `${attackerStats.name} concentró su energía.`,
                `${attackerStats.name} recuperó ${recoveredKi} puntos de KI.`,
            ];
            consumesTurn = true;
        }
    } else {
        return error(400, "Acción no válida", state);
    }

    state.visual.revision += 1;
    if (consumesTurn) {
        state.turn = 1 - state.turn;
        state.fighters[state.turn].defending = false;
        const nextName = CHARACTER_CATALOG[state.fighters[state.turn].id].name;
        state.visual.messages.push(`¿Qué hará ${nextName}?`);
    }
    return { status: 200, payload: battleView(state), state };
}

function applyImpact(state) {
    if (state.selected.length !== 2 || !state.pending || state.pending.turn !== state.turn) {
        return error(409, "No hay un impacto válido pendiente", state);
    }

    const attacker = state.fighters[state.turn];
    const defender = state.fighters[1 - state.turn];
    const attackerStats = CHARACTER_CATALOG[attacker.id];
    const defenderStats = CHARACTER_CATALOG[defender.id];
    const special = state.pending.action === "special";
    const damage = estimatedDamage(attacker, defender, special);

    defender.hp = clamp(defender.hp - damage, 0, defenderStats.hpMax);
    if (special) {
        attacker.ki = clamp(attacker.ki - attackerStats.specialCost, 0, attackerStats.kiMax);
    } else {
        attacker.ki = clamp(attacker.ki + 15, 0, attackerStats.kiMax);
    }

    state.pending = null;
    state.visual.pendingImpact = false;
    state.visual.messages = [
        `${special ? "¡Impacto especial! " : "¡Impacto! "}${defenderStats.name} recibió ${damage} puntos de daño.`,
    ];

    if (defender.hp <= 0) {
        state.visual.messages.push(`¡${attackerStats.name} ha ganado la batalla!`);
    } else {
        state.turn = 1 - state.turn;
        state.fighters[state.turn].defending = false;
        state.visual.messages.push(
            `¿Qué hará ${CHARACTER_CATALOG[state.fighters[state.turn].id].name}?`
        );
    }
    return { status: 200, payload: battleView(state), state };
}

function handleGameRequest(method, route, state, body = {}) {
    if (method === "GET" && (route === "estado" || route === "combate/estado")) {
        const payload = state.selected.length < 2 ? selectionView(state) : battleView(state);
        return { status: 200, payload, state };
    }
    if (method === "POST" && route === "seleccion") {
        return applySelection(state, body.characterId);
    }
    if (method === "POST" && route === "combate/accion") {
        return applyAction(state, body.action);
    }
    if (method === "POST" && route === "combate/impacto") {
        return applyImpact(state);
    }
    if (method === "POST" && route === "combate/reiniciar") {
        if (state.selected.length !== 2) {
            return error(409, "No hay una batalla para reiniciar", state);
        }
        prepareBattle(state, true);
        return { status: 200, payload: battleView(state), state };
    }
    if (method === "POST" && route === "seleccion/reiniciar") {
        const resetState = createInitialState();
        return { status: 200, payload: selectionView(resetState), state: resetState };
    }
    return error(404, "Ruta no encontrada", state);
}

function encodeState(state) {
    return Buffer.from(JSON.stringify(state), "utf8").toString("base64url");
}

function decodeState(cookieHeader = "") {
    const cookies = Object.fromEntries(cookieHeader.split(";").map((entry) => {
        const separator = entry.indexOf("=");
        if (separator < 0) return [entry.trim(), ""];
        return [entry.slice(0, separator).trim(), entry.slice(separator + 1)];
    }));
    if (!cookies[COOKIE_NAME]) return createInitialState();

    try {
        const state = JSON.parse(Buffer.from(cookies[COOKIE_NAME], "base64url").toString("utf8"));
        if (!Array.isArray(state.selected) || !Array.isArray(state.fighters) || !state.visual) {
            return createInitialState();
        }
        return state;
    } catch {
        return createInitialState();
    }
}

function requestBody(req) {
    if (req.body && typeof req.body === "object") return req.body;
    return Object.fromEntries(new URLSearchParams(typeof req.body === "string" ? req.body : ""));
}

module.exports = function handler(req, res) {
    const route = String(req.query?.route || "").replace(/^\/+|\/+$/g, "");
    const state = decodeState(req.headers.cookie);
    const result = handleGameRequest(req.method, route, state, requestBody(req));
    const cookie = `${COOKIE_NAME}=${encodeState(result.state)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400; Secure`;

    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Set-Cookie", cookie);
    res.status(result.status).json(result.payload);
};

module.exports.createInitialState = createInitialState;
module.exports.handleGameRequest = handleGameRequest;
module.exports.encodeState = encodeState;
module.exports.decodeState = decodeState;
