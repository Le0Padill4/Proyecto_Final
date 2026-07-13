const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

const root = path.resolve(__dirname, "..");
const catalogSource = fs.readFileSync(path.join(root, "public/attack-animations.js"), "utf8");
const context = { window: {} };
vm.runInNewContext(catalogSource, context, { filename: "attack-animations.js" });

const {
    normalizeMoveName,
    resolveMoveAnimation,
} = context.window.AttackAnimationCatalog;

const expectedAnimations = new Map([
    ["Hacer deberes en clases", "homework-rush"],
    ["Al Cesar lo que es del Cesar", "caesar-verdict"],
    ["Deberes", "homework-paper"],
    ["Herencia", "inheritance-clones"],
    ["Llegar tarde", "late-dash"],
    ["Llegar temprano", "early-warp"],
    ["Crucigrama en clase", "crossword-burst"],
    ["Profe soy becado", "scholar-shockwave"],
]);

function hash(file) {
    return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function readPngContract(file) {
    const bytes = fs.readFileSync(file);
    assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    return {
        width: bytes.readUInt32BE(16),
        height: bytes.readUInt32BE(20),
        colorType: bytes[25],
    };
}

test("normaliza mayúsculas, tildes y espacios antes de resolver", () => {
    assert.equal(normalizeMoveName("  HERÉNCIA   "), "herencia");
    assert.equal(normalizeMoveName("Puñetazo eléctrico"), "punetazo electrico");
});

test("los ocho ataques actuales tienen coincidencia exacta propia", () => {
    for (const [move, expectedId] of expectedAnimations) {
        const effect = move === "Herencia" || move === "Al Cesar lo que es del Cesar" ||
            move === "Llegar temprano" || move === "Profe soy becado"
            ? "especial"
            : "normal";
        const animation = resolveMoveAnimation(move, effect);
        assert.equal(animation.match, "exact", move);
        assert.equal(animation.id, expectedId, move);
    }
});

test("el resolvedor respeta exacta, palabra clave y fallback", () => {
    assert.equal(resolveMoveAnimation("Deberes", "normal").match, "exact");
    assert.equal(resolveMoveAnimation("Gran patada voladora", "normal").id, "kick");
    assert.equal(resolveMoveAnimation("Llama final", "especial").id, "fire");
    assert.equal(resolveMoveAnimation("Movimiento misterioso", "normal").match, "fallback");
    assert.equal(resolveMoveAnimation("Movimiento misterioso", "especial").id, "special");
    assert.equal(resolveMoveAnimation("Defender", "defensa").match, "system");
    assert.equal(resolveMoveAnimation("Cargar KI", "carga-ki").id, "ki-charge");
});

test("los ataques configurados coinciden con los declarados por los personajes C++", () => {
    const sources = ["Sexitar.cpp", "François.cpp", "leo1.cpp", "leo2.cpp"]
        .map((name) => fs.readFileSync(path.join(root, "src/personajes", name), "utf8"))
        .join("\n");
    const declared = [...sources.matchAll(/nataque(?:_especial)?\s*=\s*"([^"]+)"/g)]
        .map((match) => match[1]);
    assert.equal(declared.length, expectedAnimations.size);
    assert.deepEqual(new Set(declared), new Set(expectedAnimations.keys()));
});

test("cada personaje tiene sprites front/back RGBA exclusivos de batalla", () => {
    for (let index = 1; index <= 4; index += 1) {
        const selection = path.join(root, `public/assets/personajes/personaje-${index}.png`);
        const front = path.join(root, `public/assets/personajes/battle/personaje-${index}-front.png`);
        const back = path.join(root, `public/assets/personajes/battle/personaje-${index}-back.png`);

        for (const sprite of [front, back]) {
            assert.ok(fs.existsSync(sprite), sprite);
            assert.deepEqual(readPngContract(sprite), {
                width: 768,
                height: 768,
                colorType: 6,
            });
            assert.notEqual(hash(sprite), hash(selection));
        }
        assert.notEqual(hash(front), hash(back));
    }
});
