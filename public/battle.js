// Interfaz de combate desarrollada con apoyo de IA sobre la lógica C++ existente.
const { resolveMoveAnimation } = window.AttackAnimationCatalog;
const { AttackAnimationController } = window.AttackEffects;

class HealthBar {
    constructor() {
        this.element = document.createElement("div");
        this.element.className = "meter meter--health";
        this.element.innerHTML = `
            <div class="meter__heading"><span>PV</span><strong></strong></div>
            <div class="meter__track" role="meter" aria-label="Puntos de vida">
                <span class="meter__fill"></span>
            </div>
        `;
        this.value = this.element.querySelector("strong");
        this.track = this.element.querySelector(".meter__track");
        this.fill = this.element.querySelector(".meter__fill");
    }

    update(current, maximum) {
        const percent = maximum > 0 ? Math.max(0, Math.min(100, (current / maximum) * 100)) : 0;
        this.value.textContent = `${current} / ${maximum}`;
        this.fill.style.width = `${percent}%`;
        this.element.classList.toggle("is-low", percent <= 30);
        this.track.setAttribute("aria-valuemin", "0");
        this.track.setAttribute("aria-valuemax", String(maximum));
        this.track.setAttribute("aria-valuenow", String(current));
    }
}

class EnergyBar {
    constructor() {
        this.element = document.createElement("div");
        this.element.className = "meter meter--energy";
        this.element.innerHTML = `
            <div class="meter__heading"><span>KI</span><strong></strong></div>
            <div class="meter__track" role="meter" aria-label="Energía KI">
                <span class="meter__fill"></span>
            </div>
        `;
        this.value = this.element.querySelector("strong");
        this.track = this.element.querySelector(".meter__track");
        this.fill = this.element.querySelector(".meter__fill");
    }

    update(current, maximum) {
        const percent = maximum > 0 ? Math.max(0, Math.min(100, (current / maximum) * 100)) : 0;
        this.value.textContent = `${current} / ${maximum}`;
        this.fill.style.width = `${percent}%`;
        this.track.setAttribute("aria-valuemin", "0");
        this.track.setAttribute("aria-valuemax", String(maximum));
        this.track.setAttribute("aria-valuenow", String(current));
    }
}

class FighterStatus {
    constructor(slot) {
        this.slot = slot;
        this.element = document.createElement("section");
        this.element.className = `fighter-status fighter-status--slot-${slot}`;
        this.element.innerHTML = `
            <div class="fighter-status__heading">
                <span class="fighter-status__role"></span>
                <strong class="fighter-status__name"></strong>
            </div>
            <span class="fighter-status__state" aria-live="polite"></span>
        `;
        this.role = this.element.querySelector(".fighter-status__role");
        this.name = this.element.querySelector(".fighter-status__name");
        this.state = this.element.querySelector(".fighter-status__state");
        this.health = new HealthBar();
        this.energy = new EnergyBar();
        this.element.insertBefore(this.health.element, this.state);
        this.element.insertBefore(this.energy.element, this.state);
    }

    update(fighter, active) {
        this.role.textContent = this.slot === 1 ? "Jugador · P1" : "Rival · P2";
        this.name.textContent = fighter.name;
        this.health.update(fighter.hp, fighter.hpMax);
        this.energy.update(fighter.ki, fighter.kiMax);
        this.state.textContent = fighter.defeated
            ? "Fuera de combate"
            : fighter.defending ? "Defendiendo" : active ? "En turno" : "Listo";
        this.element.classList.toggle("is-active", active);
        this.element.classList.toggle("is-defending", fighter.defending);
        this.element.classList.toggle("is-defeated", fighter.defeated);
    }
}

class FighterSprite {
    constructor(slot) {
        this.slot = slot;
        this.element = document.createElement("figure");
        this.element.className = `fighter fighter--slot-${slot}`;
        this.element.innerHTML = `
            <span class="fighter__platform" aria-hidden="true"></span>
            <div class="fighter__portrait"><img alt=""></div>
            <figcaption></figcaption>
        `;
        this.image = this.element.querySelector("img");
        this.caption = this.element.querySelector("figcaption");
    }

    update(fighter, active) {
        this.image.src = this.slot === 1 ? fighter.imageBattleBack : fighter.imageBattleFront;
        this.image.alt = `${fighter.name}, ${this.slot === 1 ? "combatiente del jugador" : "combatiente rival"}`;
        this.caption.textContent = fighter.name;
        this.element.classList.toggle("is-active", active);
        this.element.classList.toggle("is-defending", fighter.defending);
        this.element.classList.toggle("is-defeated", fighter.defeated);
    }
}

class BattleArena {
    constructor() {
        this.element = document.createElement("section");
        this.element.className = "battle-arena";
        this.element.setAttribute("aria-label", "Campo de batalla");
        this.playerStatus = new FighterStatus(1);
        this.rivalStatus = new FighterStatus(2);
        this.playerSprite = new FighterSprite(1);
        this.rivalSprite = new FighterSprite(2);
        this.element.append(
            this.rivalStatus.element,
            this.rivalSprite.element,
            this.playerSprite.element,
            this.playerStatus.element
        );

        this.effectLayer = document.createElement("div");
        this.effectLayer.className = "battle-fx";
        this.effectLayer.setAttribute("aria-hidden", "true");
        this.effectLayer.innerHTML = `
            <strong class="battle-fx__name"></strong>
            <span class="battle-fx__screen"></span>
            <span class="battle-fx__aura"></span>
            <span class="battle-fx__beam"></span>
            <span class="battle-fx__projectile"><i></i></span>
            <span class="battle-fx__impact"></span>
            <span class="battle-fx__shield"></span>
            <span class="battle-fx__clock"></span>
            <span class="battle-fx__glyph">A</span>
            <span class="battle-fx__glyph">B</span>
            <span class="battle-fx__glyph">C</span>
            <span class="battle-fx__glyph">D</span>
            <span class="battle-fx__glyph">E</span>
            <span class="battle-fx__glyph">F</span>
            <span class="battle-fx__particle"></span>
            <span class="battle-fx__particle"></span>
            <span class="battle-fx__particle"></span>
            <span class="battle-fx__particle"></span>
            <span class="battle-fx__particle"></span>
            <span class="battle-fx__particle"></span>
            <span class="battle-fx__particle"></span>
            <span class="battle-fx__particle"></span>
        `;
        this.effectName = this.effectLayer.querySelector(".battle-fx__name");
        this.element.append(this.effectLayer);
        this.animationController = new AttackAnimationController({
            arena: this.element,
            layer: this.effectLayer,
            effectName: this.effectName,
            positionEffect: (actor, target) => this.positionEffect(actor, target),
        });

        const turnRail = document.createElement("div");
        turnRail.className = "turn-rail";
        turnRail.setAttribute("aria-hidden", "true");
        turnRail.innerHTML = "<span>P2</span><i></i><span>P1</span>";
        this.element.append(turnRail);
    }

    update(state) {
        const [player, rival] = state.players;
        this.playerStatus.update(player, state.turn === 1);
        this.rivalStatus.update(rival, state.turn === 2);
        this.playerSprite.update(player, state.turn === 1);
        this.rivalSprite.update(rival, state.turn === 2);
        this.element.dataset.turn = String(state.turn);
    }

    clearEffect() {
        this.animationController.clear();
    }

    positionEffect(actor, target) {
        const arenaBounds = this.element.getBoundingClientRect();
        const actorBounds = (actor.querySelector(".fighter__portrait") || actor).getBoundingClientRect();
        const targetBounds = (target.querySelector(".fighter__portrait") || target).getBoundingClientRect();
        const startX = actorBounds.left + actorBounds.width / 2 - arenaBounds.left;
        const startY = actorBounds.top + actorBounds.height / 2 - arenaBounds.top;
        const endX = targetBounds.left + targetBounds.width / 2 - arenaBounds.left;
        const endY = targetBounds.top + targetBounds.height / 2 - arenaBounds.top;

        this.element.style.setProperty("--fx-start-x", `${startX}px`);
        this.element.style.setProperty("--fx-start-y", `${startY}px`);
        this.element.style.setProperty("--fx-end-x", `${endX}px`);
        this.element.style.setProperty("--fx-end-y", `${endY}px`);
        this.element.style.setProperty("--fx-travel-x", `${endX - startX}px`);
        this.element.style.setProperty("--fx-travel-y", `${endY - startY}px`);
        this.element.style.setProperty("--fx-distance", `${Math.hypot(endX - startX, endY - startY)}px`);
        this.element.style.setProperty("--fx-angle", `${Math.atan2(endY - startY, endX - startX)}rad`);
        this.element.style.setProperty("--fx-wind-x", `${(endX - startX) * 0.12}px`);
        this.element.style.setProperty("--fx-wind-y", `${(endY - startY) * 0.12}px`);
        this.element.style.setProperty("--fx-strike-x", `${(endX - startX) * 0.7}px`);
        this.element.style.setProperty("--fx-strike-y", `${(endY - startY) * 0.7}px`);
        this.element.style.setProperty("--fx-strike-return-x", `${(endX - startX) * 0.62}px`);
        this.element.style.setProperty("--fx-strike-return-y", `${(endY - startY) * 0.62}px`);
        this.element.style.setProperty("--fx-kick-x", `${(endX - startX) * 0.64}px`);
        this.element.style.setProperty("--fx-kick-y", `${(endY - startY) * 0.64 - 18}px`);
        this.element.style.setProperty("--fx-kick-return-x", `${(endX - startX) * 0.54}px`);
        this.element.style.setProperty("--fx-kick-return-y", `${(endY - startY) * 0.54}px`);
        this.element.style.setProperty("--fx-speed-start", `${(endX - startX) * -0.25}px`);
        this.element.style.setProperty("--fx-speed-end", `${(endX - startX) * 0.3}px`);
        this.element.style.setProperty("--fx-clone-mid-x", `${(endX - startX) * 0.45}px`);
        this.element.style.setProperty("--fx-clone-mid-y", `${(endY - startY) * 0.45}px`);
        this.element.style.setProperty("--fx-paper-mid-x", `${(endX - startX) * 0.52}px`);
        this.element.style.setProperty("--fx-paper-mid-y", `${(endY - startY) * 0.25}px`);
    }

    playEffect(state) {
        const actor = this.element.querySelector(`.fighter--slot-${state.actor}`);
        const target = this.element.querySelector(`.fighter--slot-${state.target}`);
        if (!actor || !target) return;

        const actorState = state.players?.find((fighter) => fighter.slot === state.actor);
        const moveName = state.moveName || (
            state.effect === "especial" ? actorState?.specialAttack : actorState?.normalAttack
        ) || "";
        const animation = resolveMoveAnimation(moveName, state.effect);
        if (!animation) return;
        return this.animationController.play({ state: { ...state, moveName }, animation });
    }

    showDamage(beforeState, afterState) {
        this.animationController.showDamage(beforeState, afterState);
    }
}

class BattleDialog {
    constructor() {
        this.element = document.createElement("section");
        this.element.className = "battle-dialog";
        this.element.tabIndex = 0;
        this.element.setAttribute("aria-label", "Mensajes de combate");
        this.element.innerHTML = `
            <span class="battle-dialog__label">Registro de turno</span>
            <p aria-live="polite"></p>
            <span class="battle-dialog__advance" aria-hidden="true">▼</span>
        `;
        this.text = this.element.querySelector("p");
        this.skip = false;
        this.sequence = 0;
        this.timers = new Map();
        this.element.addEventListener("click", () => { this.skip = true; });
        this.element.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                this.skip = true;
            }
        });
    }

    pause(milliseconds) {
        return new Promise((resolve) => {
            const timer = window.setTimeout(() => {
                this.timers.delete(timer);
                resolve();
            }, milliseconds);
            this.timers.set(timer, resolve);
        });
    }

    clearTimers() {
        this.timers.forEach((resolve, timer) => {
            window.clearTimeout(timer);
            resolve();
        });
        this.timers.clear();
    }

    async show(messages) {
        this.clearTimers();
        const sequence = ++this.sequence;
        const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        for (const message of messages) {
            if (sequence !== this.sequence) return;
            this.skip = false;
            this.text.textContent = "";
            for (let index = 0; index < message.length; index += 1) {
                if (sequence !== this.sequence) return;
                if (this.skip || reducedMotion) {
                    this.text.textContent = message;
                    break;
                }
                this.text.textContent += message[index];
                await this.pause(14);
            }
            await this.pause(this.skip || reducedMotion ? 80 : 480);
        }
    }

    reset(message = "") {
        this.sequence += 1;
        this.clearTimers();
        this.skip = false;
        this.text.textContent = message;
    }
}

class AttackMenu {
    constructor(onAction, onBack) {
        this.onAction = onAction;
        this.element = document.createElement("div");
        this.element.className = "attack-menu";
        this.element.hidden = true;
        this.element.innerHTML = `
            <p class="battle-menu__eyebrow"></p>
            <button class="attack-menu__move" type="button">
                <span class="attack-menu__name"></span>
                <small class="attack-menu__meta"></small>
            </button>
            <button class="attack-menu__back" type="button">← Volver</button>
        `;
        this.eyebrow = this.element.querySelector(".battle-menu__eyebrow");
        this.move = this.element.querySelector(".attack-menu__move");
        this.name = this.element.querySelector(".attack-menu__name");
        this.meta = this.element.querySelector(".attack-menu__meta");
        this.element.querySelector(".attack-menu__back").addEventListener("click", onBack);
        this.move.addEventListener("click", () => this.onAction(this.action));
    }

    open(fighter, type) {
        const special = type === "special";
        this.action = special ? "special" : "normal";
        this.eyebrow.textContent = special ? "Técnica especial" : "Ataque disponible";
        this.name.textContent = special ? fighter.specialAttack : fighter.normalAttack;
        this.meta.textContent = special
            ? `${fighter.specialDamage} daño · ${fighter.specialCost} KI`
            : `${fighter.normalDamage} daño estimado · +15 KI`;
        this.move.disabled = special && fighter.ki < fighter.specialCost;
        if (this.move.disabled) this.meta.textContent += " · KI insuficiente";
        this.element.hidden = false;
        this.move.focus();
    }
}

class BattleMenu {
    constructor(onAction) {
        this.onAction = onAction;
        this.element = document.createElement("nav");
        this.element.className = "battle-menu";
        this.element.setAttribute("aria-label", "Acciones de combate");
        this.element.innerHTML = `
            <div class="battle-menu__main">
                <p class="battle-menu__eyebrow">Elige una acción</p>
                <div class="battle-menu__grid">
                    <button type="button" data-action="attack"><span class="normal-name"></span><small>Ataque normal</small></button>
                    <button type="button" data-action="defend"><span>Defender</span><small>Reduce el próximo golpe</small></button>
                    <button type="button" data-action="special"><span class="special-name"></span><small class="special-copy"></small></button>
                    <button type="button" data-action="charge"><span>Cargar KI</span><small class="charge-copy"></small></button>
                </div>
            </div>
        `;
        this.main = this.element.querySelector(".battle-menu__main");
        this.attackMenu = new AttackMenu(onAction, () => this.showMain());
        this.element.append(this.attackMenu.element);
        this.buttons = [...this.element.querySelectorAll(".battle-menu__grid button")];

        this.element.querySelector('[data-action="attack"]').addEventListener("click", () => {
            this.openMoves("normal");
        });
        this.element.querySelector('[data-action="defend"]').addEventListener("click", () => {
            this.onAction("defend");
        });
        this.element.querySelector('[data-action="special"]').addEventListener("click", () => {
            this.openMoves("special");
        });
        this.element.querySelector('[data-action="charge"]').addEventListener("click", () => {
            this.onAction("charge");
        });
        this.element.addEventListener("keydown", (event) => this.handleNavigation(event));
    }

    update(fighter, locked = false, chargeAmount = 25) {
        this.fighter = fighter;
        const specialButton = this.element.querySelector('[data-action="special"]');
        const chargeButton = this.element.querySelector('[data-action="charge"]');
        this.element.querySelector(".normal-name").textContent = fighter.normalAttack;
        this.element.querySelector(".special-name").textContent = fighter.specialAttack;
        specialButton.querySelector(".special-copy").textContent =
            `Ataque especial · ${fighter.specialCost} KI`;
        chargeButton.querySelector(".charge-copy").textContent = fighter.ki >= fighter.kiMax
            ? "KI al máximo"
            : `+${Math.min(chargeAmount, fighter.kiMax - fighter.ki)} KI · consume turno`;
        this.buttons.forEach((button) => {
            button.disabled = locked;
        });
        if (!locked) {
            specialButton.disabled = fighter.ki < fighter.specialCost;
            chargeButton.disabled = fighter.ki >= fighter.kiMax;
        }
        if (locked) this.attackMenu.move.disabled = true;
    }

    openMoves(type) {
        this.main.hidden = true;
        this.attackMenu.open(this.fighter, type);
    }

    showMain() {
        this.attackMenu.element.hidden = true;
        this.main.hidden = false;
        this.element.querySelector('[data-action="attack"]').focus();
    }

    handleNavigation(event) {
        if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) return;
        const available = [...this.element.querySelectorAll("button:not(:disabled)")]
            .filter((button) => !button.closest("[hidden]"));
        const current = available.indexOf(document.activeElement);
        if (current < 0 || available.length < 2) return;
        event.preventDefault();
        const offset = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -2, ArrowDown: 2 }[event.key];
        const next = (current + offset + available.length) % available.length;
        available[next].focus();
    }
}

class BattleResult {
    constructor({ onReplay, onSelection }) {
        this.element = document.createElement("section");
        this.element.className = "battle-result";
        this.element.setAttribute("role", "dialog");
        this.element.setAttribute("aria-modal", "true");
        this.element.setAttribute("aria-labelledby", "battle-result-title");
        this.element.tabIndex = -1;
        this.element.hidden = true;
        this.element.innerHTML = `
            <span class="battle-result__mark" aria-hidden="true">★</span>
            <p class="battle-result__outcome">Combate finalizado</p>
            <h1 id="battle-result-title"></h1>
            <span class="battle-result__detail"></span>
            <div class="battle-result__actions">
                <button type="button" data-result-action="replay">Volver a jugar</button>
                <button type="button" data-result-action="selection">Volver a selección</button>
            </div>
        `;
        this.outcome = this.element.querySelector(".battle-result__outcome");
        this.title = this.element.querySelector("h1");
        this.detail = this.element.querySelector(".battle-result__detail");
        this.buttons = [...this.element.querySelectorAll("button")];
        this.replayButton = this.element.querySelector('[data-result-action="replay"]');
        this.replayButton.addEventListener("click", onReplay);
        this.element.querySelector('[data-result-action="selection"]').addEventListener("click", onSelection);
    }

    show(state) {
        const winner = state.players.find((fighter) => fighter.slot === state.winner);
        const playerWon = winner.slot === 1;
        this.outcome.textContent = playerWon ? "Victoria del jugador" : "Derrota del jugador";
        this.title.textContent = `${winner.name} gana`;
        this.detail.textContent = `Jugador ${winner.slot} conserva ${winner.hp} PV.`;
        this.element.classList.toggle("is-defeat", !playerWon);
        this.setBusy(false);
        this.element.hidden = false;
        this.replayButton.focus();
    }

    setBusy(busy) {
        this.buttons.forEach((button) => {
            button.disabled = busy;
        });
        this.element.setAttribute("aria-busy", String(busy));
    }

    showError(message) {
        this.detail.textContent = message;
        this.setBusy(false);
        this.replayButton.focus();
    }

    hide() {
        this.setBusy(false);
        this.element.hidden = true;
        this.element.classList.remove("is-defeat");
    }
}

class BattleScreen {
    constructor(element) {
        this.element = element;
        this.arena = new BattleArena();
        this.dialog = new BattleDialog();
        this.menu = new BattleMenu((action) => this.performAction(action));
        this.result = new BattleResult({
            onReplay: () => this.restart(),
            onSelection: () => this.returnToSelection(),
        });
        this.controls = document.createElement("div");
        this.controls.className = "battle-controls";
        this.controls.append(this.dialog.element, this.menu.element);
        this.element.append(this.arena.element, this.controls, this.result.element);
        this.busy = false;
        this.lastRevision = -1;
        this.onReturnSelection = () => {};
        window.addEventListener("pagehide", () => {
            this.arena.clearEffect();
            this.dialog.reset();
        });
    }

    setReturnSelectionHandler(handler) {
        this.onReturnSelection = handler;
    }

    resetVisualState() {
        this.busy = true;
        this.lastRevision = -1;
        this.arena.clearEffect();
        this.dialog.reset();
        this.result.hide();
        this.menu.showMain();
        this.menu.element.removeAttribute("aria-hidden");
        this.menu.element.classList.remove("is-finished");
    }

    async start(state) {
        this.resetVisualState();
        this.element.hidden = false;
        document.body.classList.add("is-battling");
        document.querySelector(".game-header__kicker").textContent = "Proyecto Final · Arena local";
        document.querySelector(".game-header__player").textContent = "VS";
        document.title = "Combate en curso · Proyecto Final";
        if (state.pendingImpact) {
            await this.resolvePendingAttack(state);
        } else {
            await this.render(state);
        }
    }

    updateHeader(state) {
        document.querySelector(".game-header__round").textContent =
            state.status === "finished" ? "Resultado final" : `Turno del jugador ${state.turn}`;
    }

    unlockMenu(state) {
        const activeFighter = state.players[state.turn - 1];
        this.busy = false;
        this.menu.update(activeFighter, false, state.chargeAmount);
        this.element.querySelector('[data-action="attack"]')?.focus();
    }

    async render(state) {
        this.state = state;
        this.busy = true;
        const activeFighter = state.players[state.turn - 1];
        this.menu.showMain();
        this.menu.update(activeFighter, true, state.chargeAmount);
        this.arena.update(state);
        this.updateHeader(state);

        if (!state.pendingImpact && state.revision !== this.lastRevision) {
            this.arena.playEffect(state);
            this.lastRevision = state.revision;
        }
        await this.dialog.show(state.messages || []);

        if (state.status === "finished") {
            this.busy = false;
            this.menu.element.setAttribute("aria-hidden", "true");
            this.menu.element.classList.add("is-finished");
            this.result.show(state);
        } else {
            this.unlockMenu(state);
        }
    }

    async resolvePendingAttack(pendingState) {
        this.state = pendingState;
        this.busy = true;
        this.lastRevision = pendingState.revision;
        this.menu.showMain();
        this.menu.update(
            pendingState.players[pendingState.turn - 1],
            true,
            pendingState.chargeAmount
        );
        this.arena.update(pendingState);
        this.updateHeader(pendingState);

        const messageTask = this.dialog.show(pendingState.messages || []);
        await Promise.resolve(this.arena.playEffect(pendingState));

        const response = await fetch("/api/combate/impacto", { method: "POST" });
        const resolvedState = await response.json();
        if (!response.ok) {
            throw new Error(resolvedState.message || "No se pudo resolver el impacto");
        }

        this.arena.update(resolvedState);
        this.arena.showDamage(pendingState, resolvedState);
        await messageTask;
        await this.dialog.show(resolvedState.messages || []);
        this.state = resolvedState;
        this.updateHeader(resolvedState);

        if (resolvedState.status === "finished") {
            this.busy = false;
            this.menu.element.setAttribute("aria-hidden", "true");
            this.menu.element.classList.add("is-finished");
            this.result.show(resolvedState);
        } else {
            this.unlockMenu(resolvedState);
        }
    }

    async performAction(action) {
        if (this.busy || this.state.status === "finished") return;
        this.busy = true;
        this.menu.update(
            this.state.players[this.state.turn - 1],
            true,
            this.state.chargeAmount
        );

        try {
            const response = await fetch("/api/combate/accion", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `action=${encodeURIComponent(action)}`,
            });
            const state = await response.json();
            if (!response.ok) throw new Error(state.message || "No se pudo ejecutar la acción");
            if (state.pendingImpact) {
                await this.resolvePendingAttack(state);
            } else {
                await this.render(state);
            }
        } catch (error) {
            this.busy = false;
            this.menu.showMain();
            this.menu.update(
                this.state.players[this.state.turn - 1],
                false,
                this.state.chargeAmount
            );
            await this.dialog.show([error.message]);
        }
    }

    async restart() {
        if (this.busy || this.state?.status !== "finished") return;
        this.busy = true;
        this.result.setBusy(true);
        try {
            const response = await fetch("/api/combate/reiniciar", { method: "POST" });
            const state = await response.json();
            if (!response.ok) throw new Error(state.message || "No se pudo reiniciar la batalla");
            await this.start(state);
        } catch (error) {
            this.busy = false;
            this.result.showError(error.message);
        }
    }

    async returnToSelection() {
        if (this.busy || this.state?.status !== "finished") return;
        this.busy = true;
        this.result.setBusy(true);
        try {
            const response = await fetch("/api/seleccion/reiniciar", { method: "POST" });
            const state = await response.json();
            if (!response.ok) throw new Error(state.message || "No se pudo volver a selección");
            this.resetVisualState();
            this.element.hidden = true;
            document.body.classList.remove("is-battling");
            this.onReturnSelection(state);
        } catch (error) {
            this.busy = false;
            this.result.showError(error.message);
        }
    }
}
