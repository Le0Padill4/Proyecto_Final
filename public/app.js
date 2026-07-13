// Esta interfaz y sus componentes fueron desarrollados con apoyo de IA.
const characters = [
    {
        id: "personaje-1",
        name: "Sexitar",
        image: "/assets/personajes/personaje-1.png",
        imageSelect: "/assets/personajes/personaje-1.png",
        imageBattleFront: "/assets/personajes/battle/personaje-1-front.png",
        imageBattleBack: "/assets/personajes/battle/personaje-1-back.png",
        specialty: "Defensa férrea",
    },
    {
        id: "personaje-2",
        name: "François",
        image: "/assets/personajes/personaje-2.png",
        imageSelect: "/assets/personajes/personaje-2.png",
        imageBattleFront: "/assets/personajes/battle/personaje-2-front.png",
        imageBattleBack: "/assets/personajes/battle/personaje-2-back.png",
        specialty: "Poder maestro",
    },
    {
        id: "personaje-3",
        name: "Leo2",
        image: "/assets/personajes/personaje-3.png",
        imageSelect: "/assets/personajes/personaje-3.png",
        imageBattleFront: "/assets/personajes/battle/personaje-3-front.png",
        imageBattleBack: "/assets/personajes/battle/personaje-3-back.png",
        specialty: "Ataque preciso",
    },
    {
        id: "personaje-4",
        name: "Leo1",
        image: "/assets/personajes/personaje-4.png",
        imageSelect: "/assets/personajes/personaje-4.png",
        imageBattleFront: "/assets/personajes/battle/personaje-4-front.png",
        imageBattleBack: "/assets/personajes/battle/personaje-4-back.png",
        specialty: "Velocidad táctica",
    },
];

class CharacterCard {
    constructor(character, onSelect) {
        this.character = character;
        this.onSelect = onSelect;
        this.element = this.render();
    }

    render() {
        const button = document.createElement("button");
        button.className = "character-card";
        button.type = "button";
        button.dataset.characterId = this.character.id;
        button.setAttribute("role", "radio");
        button.setAttribute("aria-checked", "false");
        button.setAttribute("aria-label", `Seleccionar a ${this.character.name}`);
        button.innerHTML = `
            <span class="character-card__number" aria-hidden="true">${this.character.id.at(-1)}</span>
            <span class="character-card__portrait">
                <img src="${this.character.imageSelect}" alt="Retrato pixel art de ${this.character.name}">
            </span>
            <span class="character-card__info">
                <strong>${this.character.name}</strong>
                <small>${this.character.specialty}</small>
            </span>
            <span class="character-card__selected" aria-hidden="true">Seleccionado</span>
        `;
        button.addEventListener("click", () => this.onSelect(this.character.id));
        return button;
    }

    setSelected(selected) {
        this.element.classList.toggle("is-selected", selected);
        this.element.setAttribute("aria-checked", String(selected));
    }

    setUnavailable(unavailable) {
        this.element.disabled = unavailable;
        this.element.classList.toggle("is-unavailable", unavailable);
        if (unavailable) {
            this.element.setAttribute("aria-label", `${this.character.name}, ya elegido`);
        } else {
            this.element.setAttribute("aria-label", `Seleccionar a ${this.character.name}`);
        }
    }
}

class CharacterSelection {
    constructor(battleScreen) {
        this.battleScreen = battleScreen;
        this.screen = document.querySelector("#selection-screen");
        this.grid = document.querySelector("#character-grid");
        this.title = document.querySelector("#selection-title");
        this.instructions = document.querySelector("#selection-instructions");
        this.status = document.querySelector("#selection-status");
        this.playerIndicator = document.querySelector("#player-indicator");
        this.confirmButton = document.querySelector("#confirm-button");
        this.selectedId = null;
        this.player = 1;
        this.cards = characters.map(
            (character) => new CharacterCard(character, (id) => this.select(id))
        );
        this.battleScreen.setReturnSelectionHandler((state) => this.reset(state));
    }

    async init() {
        this.cards.forEach((card) => this.grid.append(card.element));
        this.confirmButton.addEventListener("click", () => this.confirm());
        this.grid.addEventListener("keydown", (event) => this.handleArrowNavigation(event));

        try {
            const response = await fetch("/api/estado", { cache: "no-store" });
            if (!response.ok) throw new Error("Estado no disponible");
            const state = await response.json();
            if (state.status === "battle" || state.status === "finished") {
                this.complete(state);
                return;
            }
            this.player = state.player;
            this.updatePlayerCopy();
            if (state.unavailableId) this.disableCharacter(state.unavailableId);
        } catch {
            this.showError("La conexión con el juego no está disponible. Ejecuta el juego para seleccionar.");
        }
    }

    select(id) {
        const card = this.cards.find((item) => item.character.id === id);
        if (!card || card.element.disabled) return;

        this.selectedId = id;
        this.cards.forEach((item) => item.setSelected(item.character.id === id));
        this.confirmButton.disabled = false;
        this.status.textContent = `${card.character.name} está listo para combatir`;
    }

    async confirm() {
        if (!this.selectedId) return;

        this.confirmButton.disabled = true;
        this.confirmButton.classList.add("is-loading");
        this.status.textContent = "Confirmando selección…";

        try {
            const response = await fetch("/api/seleccion", {
                method: "POST",
                headers: { "Content-Type": "application/x-www-form-urlencoded" },
                body: `characterId=${encodeURIComponent(this.selectedId)}`,
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message || "Selección no válida");

            window.gameSelectionState = {
                player: this.player,
                characterId: this.selectedId,
            };
            window.dispatchEvent(new CustomEvent("character:selected", {
                detail: window.gameSelectionState,
            }));

            if (result.status === "next") {
                this.disableCharacter(result.unavailableId);
                this.player = result.nextPlayer;
                this.selectedId = null;
                this.cards.forEach((card) => card.setSelected(false));
                this.updatePlayerCopy();
                this.status.textContent = "Jugador 1 confirmado. Continúa el jugador 2.";
                this.confirmButton.classList.remove("is-loading");
                this.focusFirstAvailableCard();
                return;
            }

            this.complete(result);
        } catch (error) {
            this.showError(error.message);
            this.confirmButton.disabled = false;
            this.confirmButton.classList.remove("is-loading");
        }
    }

    disableCharacter(id) {
        const card = this.cards.find((item) => item.character.id === id);
        if (card) card.setUnavailable(true);
    }

    updatePlayerCopy() {
        this.playerIndicator.textContent = `P${this.player}`;
        this.title.textContent = `Jugador ${this.player}, selecciona tu personaje`;
        this.instructions.textContent = this.player === 1
            ? "Elige una tarjeta y confirma para entrar a la arena."
            : "Elige un combatiente distinto para completar el enfrentamiento.";
        document.title = `Jugador ${this.player} · Selección de personajes`;
    }

    complete(state) {
        this.screen.hidden = true;
        this.confirmButton.classList.remove("is-loading");
        this.battleScreen.start(state);
    }

    reset(state = { player: 1 }) {
        this.player = state.player || 1;
        this.selectedId = null;
        this.cards.forEach((card) => {
            card.setSelected(false);
            card.setUnavailable(false);
        });
        this.status.classList.remove("is-error");
        this.status.textContent = "Ningún personaje seleccionado";
        this.confirmButton.disabled = true;
        this.confirmButton.classList.remove("is-loading");
        this.screen.hidden = false;
        document.querySelector(".game-header__kicker").textContent =
            "Proyecto Final · Combate por turnos";
        document.querySelector(".game-header__round").textContent = "Ronda de selección";
        this.updatePlayerCopy();
        this.focusFirstAvailableCard();
    }

    showError(message) {
        this.status.textContent = message;
        this.status.classList.add("is-error");
    }

    focusFirstAvailableCard() {
        const first = this.cards.find((card) => !card.element.disabled);
        first?.element.focus();
    }

    handleArrowNavigation(event) {
        const arrows = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];
        if (!arrows.includes(event.key)) return;

        const available = this.cards
            .map((card) => card.element)
            .filter((element) => !element.disabled);
        const currentIndex = available.indexOf(document.activeElement);
        if (currentIndex < 0) return;

        event.preventDefault();
        const columns = window.matchMedia("(max-width: 720px)").matches ? 1 : 2;
        const offsets = {
            ArrowLeft: -1,
            ArrowRight: 1,
            ArrowUp: -columns,
            ArrowDown: columns,
        };
        const nextIndex = Math.min(
            available.length - 1,
            Math.max(0, currentIndex + offsets[event.key])
        );
        available[nextIndex].focus();
    }
}

const battleScreen = new BattleScreen(document.querySelector("#battle-screen"));
new CharacterSelection(battleScreen).init();
