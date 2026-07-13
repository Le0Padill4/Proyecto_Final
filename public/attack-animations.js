// Configuración y resolución centralizada de movimientos por nombre.
(function exposeAttackAnimationCatalog(global) {
    "use strict";

    const normalizeMoveName = (name = "") => name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    const exact = Object.freeze({
        "hacer deberes en clases": {
            id: "homework-rush", kind: "paper", component: "paper",
            duration: 1320, impactAt: 880, accent: "#ffc857",
        },
        "al cesar lo que es del cesar": {
            id: "caesar-verdict", kind: "energy", component: "projectile",
            duration: 1480, impactAt: 1010, accent: "#ffd86b",
        },
        deberes: {
            id: "homework-paper", kind: "paper", component: "paper",
            duration: 1420, impactAt: 930, accent: "#f2f5ff",
        },
        herencia: {
            id: "inheritance-clones", kind: "clone", component: "clone",
            duration: 1880, impactAt: 1320, accent: "#b486ff",
        },
        "llegar tarde": {
            id: "late-dash", kind: "kick", component: "impact",
            duration: 1120, impactAt: 720, accent: "#ff526b",
        },
        "llegar temprano": {
            id: "early-warp", kind: "ice", component: "projectile",
            duration: 1480, impactAt: 1030, accent: "#72e7ff",
        },
        "crucigrama en clase": {
            id: "crossword-burst", kind: "projectile", component: "projectile",
            duration: 1360, impactAt: 910, accent: "#a8ed64",
        },
        "profe soy becado": {
            id: "scholar-shockwave", kind: "special", component: "projectile",
            duration: 1560, impactAt: 1070, accent: "#ffcf70",
        },
    });

    const keywordRules = Object.freeze([
        { keywords: ["golpe", "punetazo", "puno", "combo", "impacto"], id: "strike", kind: "strike", component: "impact", accent: "#ffc857" },
        { keywords: ["patada", "patadas", "kick", "tacon"], id: "kick", kind: "kick", component: "impact", accent: "#ff9d57" },
        { keywords: ["fuego", "llama", "incendio", "meteorito", "explosion"], id: "fire", kind: "fire", component: "projectile", accent: "#ff654f" },
        { keywords: ["rayo", "trueno", "electrico", "electrica", "electricidad", "voltio"], id: "electric", kind: "electric", component: "projectile", accent: "#79f2ff" },
        { keywords: ["ki", "energia", "aura", "onda", "esfera", "laser"], id: "ki", kind: "energy", component: "projectile", accent: "#63a7ff" },
        { keywords: ["hielo", "helado", "congelar", "congelacion", "nieve", "glaciar"], id: "ice", kind: "ice", component: "projectile", accent: "#9cecff" },
        { keywords: ["escudo", "defensa", "defender", "bloqueo", "barrera"], id: "defense", kind: "defense", component: "impact", accent: "#19c5ff" },
        { keywords: ["curar", "curacion", "sanar", "vida", "recuperar"], id: "heal", kind: "heal", component: "impact", accent: "#75e892" },
        { keywords: ["deber", "tarea", "documento", "hoja"], id: "paper", kind: "paper", component: "paper", accent: "#f2f5ff" },
    ]);

    function resolveMoveAnimation(moveName, effect) {
        if (effect === "defensa") {
            return { id: "defense", kind: "defense", component: "impact", duration: 880, impactAt: 440, accent: "#19c5ff", match: "system" };
        }
        if (effect === "carga-ki") {
            return { id: "ki-charge", kind: "energy", component: "impact", duration: 980, impactAt: 490, accent: "#19c5ff", match: "system" };
        }
        if (effect !== "normal" && effect !== "especial") return null;

        const normalizedName = normalizeMoveName(moveName);
        const exactMatch = exact[normalizedName];
        if (exactMatch) return { ...exactMatch, match: "exact" };

        const keywordMatch = keywordRules.find(({ keywords }) =>
            keywords.some((keyword) => normalizedName.split(" ").includes(keyword))
        );
        if (keywordMatch) {
            return {
                ...keywordMatch,
                duration: effect === "especial" ? 1320 : 980,
                impactAt: effect === "especial" ? 900 : 650,
                match: "keyword",
            };
        }

        return effect === "especial"
            ? { id: "special", kind: "special", component: "projectile", duration: 1360, impactAt: 920, accent: "#ffc857", match: "fallback" }
            : { id: "strike", kind: "strike", component: "impact", duration: 960, impactAt: 620, accent: "#ffc857", match: "fallback" };
    }

    global.AttackAnimationCatalog = Object.freeze({
        exact,
        keywordRules,
        normalizeMoveName,
        resolveMoveAnimation,
    });
}(window));
