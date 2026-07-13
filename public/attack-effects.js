// Componentes visuales reutilizables y controlador del ciclo de animación.
(function exposeAttackEffects(global) {
    "use strict";

    class EffectComponent {
        constructor(layer) {
            this.layer = layer;
            this.nodes = [];
        }

        append(node) {
            this.nodes.push(node);
            this.layer.append(node);
            return node;
        }

        clear() {
            this.nodes.forEach((node) => node.remove());
            this.nodes = [];
        }
    }

    class CloneAttackEffect extends EffectComponent {
        mount({ actorImage }) {
            const group = document.createElement("span");
            group.className = "battle-fx__clones";
            for (let index = 0; index < 4; index += 1) {
                const clone = document.createElement("img");
                clone.className = "battle-fx__clone";
                clone.src = actorImage.src;
                clone.alt = "";
                clone.style.setProperty("--clone-index", index);
                group.append(clone);
            }
            this.append(group);
        }
    }

    class PaperAttackEffect extends EffectComponent {
        mount() {
            const group = document.createElement("span");
            group.className = "battle-fx__papers";
            for (let index = 0; index < 3; index += 1) {
                const paper = document.createElement("span");
                paper.className = "battle-fx__paper";
                paper.style.setProperty("--paper-index", index);
                paper.innerHTML = `
                    <strong>C++</strong>
                    <i></i><i></i><i></i>
                `;
                group.append(paper);
            }
            this.append(group);
        }
    }

    class ProjectileEffect extends EffectComponent {
        mount() {
            // El proyectil base vive en BattleArena para compartir geometría y estilos.
        }
    }

    class ImpactEffect extends EffectComponent {
        mount() {
            // El destello base vive en BattleArena y se posiciona sobre el objetivo.
        }
    }

    class DamageNumber extends EffectComponent {
        show({ target, amount, arena }) {
            if (amount <= 0) return null;
            const arenaBounds = arena.getBoundingClientRect();
            const targetBounds = target.getBoundingClientRect();
            const number = document.createElement("output");
            number.className = "damage-number";
            number.setAttribute("aria-label", `${amount} puntos de daño`);
            number.textContent = `−${amount}`;
            number.style.left = `${targetBounds.left + targetBounds.width / 2 - arenaBounds.left}px`;
            number.style.top = `${targetBounds.top + targetBounds.height * 0.3 - arenaBounds.top}px`;
            return this.append(number);
        }
    }

    class AttackAnimationController {
        constructor({ arena, layer, effectName, positionEffect }) {
            this.arena = arena;
            this.layer = layer;
            this.effectName = effectName;
            this.positionEffect = positionEffect;
            this.timers = new Set();
            this.component = null;
            this.damageNumber = new DamageNumber(layer);
            this.damageTimer = null;
        }

        schedule(callback, delay) {
            const timer = window.setTimeout(() => {
                this.timers.delete(timer);
                callback();
            }, delay);
            this.timers.add(timer);
            return timer;
        }

        clear({ keepDamage = false } = {}) {
            this.timers.forEach((timer) => window.clearTimeout(timer));
            this.timers.clear();
            this.component?.clear();
            this.component = null;
            if (!keepDamage) {
                window.clearTimeout(this.damageTimer);
                this.damageTimer = null;
                this.damageNumber.clear();
            }

            this.arena.querySelectorAll(".fighter.is-performing-move, .fighter.is-hit")
                .forEach((fighter) => fighter.classList.remove("is-performing-move", "is-hit"));
            this.arena.classList.remove("is-playing-effect", "effect-special");
            delete this.arena.dataset.animation;
            delete this.arena.dataset.effectKind;
            delete this.arena.dataset.actor;
            this.effectName.textContent = "";
        }

        createComponent(type) {
            const components = {
                clone: CloneAttackEffect,
                paper: PaperAttackEffect,
                projectile: ProjectileEffect,
                impact: ImpactEffect,
            };
            const Component = components[type] || ImpactEffect;
            return new Component(this.layer);
        }

        play({ state, animation }) {
            this.clear();
            const actor = this.arena.querySelector(`.fighter--slot-${state.actor}`);
            const target = this.arena.querySelector(`.fighter--slot-${state.target}`);
            if (!actor || !target || !animation) return Promise.resolve();

            this.positionEffect(actor, target);
            this.arena.style.setProperty("--fx-accent", animation.accent);
            this.arena.style.setProperty("--fx-duration", `${animation.duration}ms`);
            this.arena.style.setProperty("--fx-impact-delay", `${Math.max(0, animation.impactAt - 180)}ms`);
            this.arena.dataset.animation = animation.id;
            this.arena.dataset.effectKind = animation.kind;
            this.arena.dataset.actor = String(state.actor);
            this.effectName.textContent = state.moveName || "";

            this.component = this.createComponent(animation.component);
            this.component.mount({
                actor,
                target,
                actorImage: actor.querySelector("img"),
                arena: this.arena,
            });

            void this.arena.offsetWidth;
            this.arena.classList.add("is-playing-effect");
            this.arena.classList.toggle("effect-special", state.effect === "especial");
            actor.classList.add("is-performing-move");

            const reducedMotion = global.matchMedia("(prefers-reduced-motion: reduce)").matches;
            const impactDelay = reducedMotion ? 90 : animation.impactAt;
            const hitDelay = Math.max(0, impactDelay - (reducedMotion ? 0 : 240));
            const cleanupDelay = reducedMotion ? 180 : animation.duration;

            if (state.target !== state.actor) {
                this.schedule(() => target.classList.add("is-hit"), hitDelay);
            }
            this.schedule(() => this.clear({ keepDamage: true }), cleanupDelay);

            return new Promise((resolve) => this.schedule(resolve, impactDelay));
        }

        showDamage(beforeState, afterState) {
            const targetBefore = beforeState.players.find((fighter) => fighter.slot === beforeState.target);
            const targetAfter = afterState.players.find((fighter) => fighter.slot === beforeState.target);
            const target = this.arena.querySelector(`.fighter--slot-${beforeState.target}`);
            const amount = targetBefore && targetAfter ? targetBefore.hp - targetAfter.hp : 0;
            window.clearTimeout(this.damageTimer);
            this.damageNumber.clear();
            if (target) this.damageNumber.show({ target, amount, arena: this.arena });
            this.damageTimer = window.setTimeout(() => {
                this.damageNumber.clear();
                this.damageTimer = null;
            }, 1050);
        }

        destroy() {
            this.clear();
        }
    }

    global.AttackEffects = Object.freeze({
        AttackAnimationController,
        CloneAttackEffect,
        PaperAttackEffect,
        ProjectileEffect,
        ImpactEffect,
        DamageNumber,
    });
}(window));
