#include "seleccion_personajes.h"
#include "personaje.h"

#include <array>
#include <cstdlib>
#include <filesystem>
#include <fstream>
#include <iostream>
#include <sstream>
#include <string>
#include <thread>
#include <vector>

#ifdef _WIN32
#include <winsock2.h>
#include <ws2tcpip.h>
using Socket = SOCKET;
using LongitudSocket = int;
constexpr Socket SOCKET_INVALIDO = INVALID_SOCKET;
#else
#include <arpa/inet.h>
#include <netinet/in.h>
#include <sys/socket.h>
#include <unistd.h>
using Socket = int;
using LongitudSocket = socklen_t;
constexpr Socket SOCKET_INVALIDO = -1;
#endif

namespace {

constexpr std::array<const char*, 4> IDS_PERSONAJES = {
    "personaje-1", "personaje-2", "personaje-3", "personaje-4"
};
constexpr int KI_POR_CARGA = 25;

struct EstadoVisualCombate {
    std::string efecto = "entrada";
    std::string movimiento;
    int actor = 1;
    int objetivo = 2;
    int revision = 0;
    bool impactoPendiente = false;
    std::vector<std::string> mensajes;
};

struct AccionPendiente {
    bool activa = false;
    std::string accion;
    int turno = 0;
};

std::string escaparJson(const std::string& texto) {
    std::ostringstream salida;
    for (const unsigned char caracter : texto) {
        switch (caracter) {
            case '\"': salida << "\\\""; break;
            case '\\': salida << "\\\\"; break;
            case '\n': salida << "\\n"; break;
            case '\r': salida << "\\r"; break;
            case '\t': salida << "\\t"; break;
            default:
                if (caracter < 0x20) {
                    salida << "?";
                } else {
                    salida << caracter;
                }
        }
    }
    return salida.str();
}

std::string valorFormulario(const std::string& cuerpo, const std::string& clave) {
    const std::string prefijo = clave + "=";
    const auto inicio = cuerpo.find(prefijo);
    if (inicio == std::string::npos) return {};
    const auto inicioValor = inicio + prefijo.size();
    const auto fin = cuerpo.find('&', inicioValor);
    return cuerpo.substr(inicioValor, fin - inicioValor);
}

std::string mensajesJson(const std::vector<std::string>& mensajes) {
    std::ostringstream json;
    json << "[";
    for (std::size_t i = 0; i < mensajes.size(); ++i) {
        if (i > 0) json << ",";
        json << "\"" << escaparJson(mensajes[i]) << "\"";
    }
    json << "]";
    return json.str();
}

int danoNormalEstimado(const Personaje& atacante, const Personaje& objetivo) {
    int dano = atacante.getAtaque() - (objetivo.getDefensa() / 2);
    if (dano < 1) dano = 1;
    if (objetivo.getDefiende()) dano /= 2;
    return dano;
}

int danoEspecialEstimado(const Personaje& atacante, const Personaje& objetivo) {
    int dano = (atacante.getAtaque() * 2) - objetivo.getDefensa();
    if (dano < 1) dano = 1;
    if (objetivo.getDefiende()) dano /= 2;
    return dano;
}

std::string personajeJson(
    const Personaje& personaje,
    int indicePersonaje,
    int puesto,
    const Personaje& objetivo
) {
    std::ostringstream json;
    json << "{"
         << "\"slot\":" << puesto << ","
         << "\"id\":\"" << IDS_PERSONAJES[static_cast<std::size_t>(indicePersonaje)] << "\","
         << "\"name\":\"" << escaparJson(personaje.getNombre()) << "\","
         << "\"image\":\"/assets/personajes/" << IDS_PERSONAJES[static_cast<std::size_t>(indicePersonaje)] << ".png\","
         << "\"imageSelect\":\"/assets/personajes/" << IDS_PERSONAJES[static_cast<std::size_t>(indicePersonaje)] << ".png\","
         << "\"imageBattleFront\":\"/assets/personajes/battle/" << IDS_PERSONAJES[static_cast<std::size_t>(indicePersonaje)] << "-front.png\","
         << "\"imageBattleBack\":\"/assets/personajes/battle/" << IDS_PERSONAJES[static_cast<std::size_t>(indicePersonaje)] << "-back.png\","
         << "\"hp\":" << personaje.getHp() << ","
         << "\"hpMax\":" << personaje.getHpMax() << ","
         << "\"ki\":" << personaje.getKi() << ","
         << "\"kiMax\":" << personaje.getKiMax() << ","
         << "\"defending\":" << (personaje.getDefiende() ? "true" : "false") << ","
         << "\"defeated\":" << (personaje.vive() ? "false" : "true") << ","
         << "\"normalAttack\":\"" << escaparJson(personaje.getNataque()) << "\","
         << "\"normalDamage\":" << danoNormalEstimado(personaje, objetivo) << ","
         << "\"specialAttack\":\"" << escaparJson(personaje.getNataqueEspecial()) << "\","
         << "\"specialDamage\":" << danoEspecialEstimado(personaje, objetivo) << ","
         << "\"specialCost\":" << personaje.getKiEspecial()
         << "}";
    return json.str();
}

std::string estadoCombateJson(
    Personaje* personajes[],
    const std::vector<int>& seleccionados,
    int turno,
    const EstadoVisualCombate& visual
) {
    Personaje& jugador1 = *personajes[seleccionados[0]];
    Personaje& jugador2 = *personajes[seleccionados[1]];
    const bool finalizado = !jugador1.vive() || !jugador2.vive();
    const int ganador = finalizado ? (jugador1.vive() ? 1 : 2) : 0;

    std::ostringstream json;
    json << "{"
         << "\"status\":\"" << (finalizado ? "finished" : "battle") << "\","
         << "\"turn\":" << (turno + 1) << ","
         << "\"winner\":" << (ganador == 0 ? "null" : std::to_string(ganador)) << ","
         << "\"chargeAmount\":" << KI_POR_CARGA << ","
         << "\"revision\":" << visual.revision << ","
         << "\"pendingImpact\":" << (visual.impactoPendiente ? "true" : "false") << ","
         << "\"effect\":\"" << visual.efecto << "\","
         << "\"moveName\":\"" << escaparJson(visual.movimiento) << "\","
         << "\"actor\":" << visual.actor << ","
         << "\"target\":" << visual.objetivo << ","
         << "\"messages\":" << mensajesJson(visual.mensajes) << ","
         << "\"players\":["
         << personajeJson(jugador1, seleccionados[0], 1, jugador2) << ","
         << personajeJson(jugador2, seleccionados[1], 2, jugador1)
         << "]}";
    return json.str();
}

void cerrarSocket(Socket socket) {
#ifdef _WIN32
    closesocket(socket);
#else
    close(socket);
#endif
}

bool enviarTodo(Socket socket, const std::string& contenido) {
    std::size_t enviados = 0;
    while (enviados < contenido.size()) {
        const int resultado = send(
            socket,
            contenido.data() + enviados,
            static_cast<int>(contenido.size() - enviados),
            0
        );
        if (resultado <= 0) {
            return false;
        }
        enviados += static_cast<std::size_t>(resultado);
    }
    return true;
}

std::string respuestaHttp(
    const std::string& estado,
    const std::string& tipo,
    const std::string& cuerpo
) {
    std::ostringstream respuesta;
    respuesta << "HTTP/1.1 " << estado << "\r\n"
              << "Content-Type: " << tipo << "\r\n"
              << "Content-Length: " << cuerpo.size() << "\r\n"
              << "Cache-Control: no-store\r\n"
              << "X-Content-Type-Options: nosniff\r\n"
              << "Connection: close\r\n\r\n"
              << cuerpo;
    return respuesta.str();
}

std::string leerArchivo(const std::filesystem::path& ruta) {
    std::ifstream archivo(ruta, std::ios::binary);
    if (!archivo) {
        return {};
    }

    std::ostringstream contenido;
    contenido << archivo.rdbuf();
    return contenido.str();
}

std::string tipoMime(const std::filesystem::path& ruta) {
    const std::string extension = ruta.extension().string();
    if (extension == ".html") return "text/html; charset=utf-8";
    if (extension == ".css") return "text/css; charset=utf-8";
    if (extension == ".js") return "text/javascript; charset=utf-8";
    if (extension == ".png") return "image/png";
    return "application/octet-stream";
}

std::filesystem::path encontrarDirectorioPublico(const std::string& rutaEjecutable) {
    std::vector<std::filesystem::path> candidatos;

#ifdef PROYECTO_PUBLIC_DIR
    candidatos.emplace_back(PROYECTO_PUBLIC_DIR);
#endif

    candidatos.emplace_back(std::filesystem::current_path() / "public");
    candidatos.emplace_back(std::filesystem::current_path().parent_path() / "public");

    if (!rutaEjecutable.empty()) {
        const auto directorioEjecutable = std::filesystem::absolute(rutaEjecutable).parent_path();
        candidatos.emplace_back(directorioEjecutable / "public");
        candidatos.emplace_back(directorioEjecutable.parent_path() / "public");
    }

    for (const auto& candidato : candidatos) {
        if (std::filesystem::exists(candidato / "index.html")) {
            return std::filesystem::canonical(candidato);
        }
    }

    return {};
}

std::string recibirSolicitud(Socket cliente) {
    std::string solicitud;
    std::array<char, 4096> buffer{};
    std::size_t longitudCuerpo = 0;
    std::size_t finCabeceras = std::string::npos;

    while (solicitud.size() < 1024 * 1024) {
        const int recibidos = recv(cliente, buffer.data(), static_cast<int>(buffer.size()), 0);
        if (recibidos <= 0) {
            break;
        }
        solicitud.append(buffer.data(), static_cast<std::size_t>(recibidos));

        if (finCabeceras == std::string::npos) {
            finCabeceras = solicitud.find("\r\n\r\n");
            if (finCabeceras != std::string::npos) {
                const std::string clave = "Content-Length:";
                const auto posicion = solicitud.find(clave);
                if (posicion != std::string::npos && posicion < finCabeceras) {
                    const auto inicio = posicion + clave.size();
                    longitudCuerpo = static_cast<std::size_t>(std::stoul(solicitud.substr(inicio)));
                }
            }
        }

        if (finCabeceras != std::string::npos &&
            solicitud.size() >= finCabeceras + 4 + longitudCuerpo) {
            break;
        }
    }

    return solicitud;
}

int indicePersonaje(const std::string& cuerpo) {
    const std::string id = valorFormulario(cuerpo, "characterId");
    for (std::size_t i = 0; i < IDS_PERSONAJES.size(); ++i) {
        if (id == IDS_PERSONAJES[i]) {
            return static_cast<int>(i);
        }
    }
    return -1;
}

void abrirNavegador(const std::string& url) {
    if (std::getenv("PROYECTO_NO_ABRIR_NAVEGADOR") != nullptr) {
        return;
    }

#ifdef _WIN32
    const std::string comando = "start \"\" \"" + url + "\"";
#elif __APPLE__
    const std::string comando = "open \"" + url + "\"";
#else
    const std::string comando = "xdg-open \"" + url + "\"";
#endif

    std::thread([comando]() {
        std::system(comando.c_str());
    }).detach();
}

bool rutaEstaticaValida(const std::string& ruta) {
    return ruta == "/" || ruta == "/index.html" || ruta == "/styles.css" ||
           ruta == "/battle.css" || ruta == "/app.js" || ruta == "/battle.js" ||
           ruta == "/attack-animations.js" || ruta == "/attack-effects.js" ||
           ruta.rfind("/assets/personajes/", 0) == 0;
}

}  // namespace

SeleccionJugadores seleccionarPersonajesWeb(
    Personaje* personajes[],
    int cantidad,
    const std::string& rutaEjecutable
) {
    if (personajes == nullptr || cantidad != static_cast<int>(IDS_PERSONAJES.size())) {
        std::cerr << "No se pudo iniciar la partida visual: equipo no valido.\n";
        return {-1, -1, false};
    }

    const auto directorioPublico = encontrarDirectorioPublico(rutaEjecutable);
    if (directorioPublico.empty()) {
        std::cerr << "No se encontro la interfaz web. Se usara la seleccion por consola.\n";
        return {-1, -1, false};
    }

#ifdef _WIN32
    WSADATA datosWinsock{};
    if (WSAStartup(MAKEWORD(2, 2), &datosWinsock) != 0) {
        return {-1, -1, false};
    }
#endif

    Socket servidor = socket(AF_INET, SOCK_STREAM, 0);
    if (servidor == SOCKET_INVALIDO) {
#ifdef _WIN32
        WSACleanup();
#endif
        return {-1, -1, false};
    }

    int reutilizar = 1;
    setsockopt(
        servidor,
        SOL_SOCKET,
        SO_REUSEADDR,
        reinterpret_cast<const char*>(&reutilizar),
        sizeof(reutilizar)
    );

    sockaddr_in direccion{};
    direccion.sin_family = AF_INET;
    direccion.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    direccion.sin_port = 0;

    if (bind(servidor, reinterpret_cast<sockaddr*>(&direccion), sizeof(direccion)) != 0 ||
        listen(servidor, 8) != 0) {
        cerrarSocket(servidor);
#ifdef _WIN32
        WSACleanup();
#endif
        return {-1, -1, false};
    }

    LongitudSocket longitudDireccion = sizeof(direccion);
    getsockname(servidor, reinterpret_cast<sockaddr*>(&direccion), &longitudDireccion);
    const int puerto = ntohs(direccion.sin_port);
    const std::string url = "http://127.0.0.1:" + std::to_string(puerto);

    std::cout << "Abriendo seleccion de personajes en " << url << std::endl;
    abrirNavegador(url);

    std::vector<int> seleccionados;
    EstadoVisualCombate visual;
    AccionPendiente pendiente;
    int turno = 0;

    auto reiniciarTodos = [&]() {
        for (int i = 0; i < cantidad; ++i) {
            personajes[i]->reiniciarCombate();
        }
        pendiente = {};
        visual = {};
        turno = 0;
    };

    auto prepararInicioBatalla = [&]() {
        Personaje& jugador1 = *personajes[seleccionados[0]];
        Personaje& jugador2 = *personajes[seleccionados[1]];
        jugador1.reiniciarCombate();
        jugador2.reiniciarCombate();
        turno = 0;
        pendiente = {};
        visual = {};
        visual.efecto = "entrada";
        visual.actor = 1;
        visual.objetivo = 2;
        visual.revision++;
        visual.mensajes = {
            "¡" + jugador1.getNombre() + " contra " + jugador2.getNombre() + "!",
            "¿Qué hará " + jugador1.getNombre() + "?"
        };
    };

    while (true) {
        Socket cliente = accept(servidor, nullptr, nullptr);
        if (cliente == SOCKET_INVALIDO) {
            break;
        }

        const std::string solicitud = recibirSolicitud(cliente);
        const auto finPrimeraLinea = solicitud.find("\r\n");
        const std::string primeraLinea = solicitud.substr(0, finPrimeraLinea);
        std::istringstream linea(primeraLinea);
        std::string metodo;
        std::string ruta;
        linea >> metodo >> ruta;

        std::string respuesta;
        if (metodo == "POST" && ruta == "/api/seleccion") {
            const auto inicioCuerpo = solicitud.find("\r\n\r\n");
            const std::string cuerpo = inicioCuerpo == std::string::npos
                ? std::string{}
                : solicitud.substr(inicioCuerpo + 4);
            const int indice = indicePersonaje(cuerpo);

            if (indice < 0 || seleccionados.size() >= 2 ||
                (!seleccionados.empty() && seleccionados.front() == indice)) {
                respuesta = respuestaHttp(
                    "400 Bad Request",
                    "application/json; charset=utf-8",
                    "{\"status\":\"error\",\"message\":\"Seleccion no valida\"}"
                );
            } else {
                seleccionados.push_back(indice);
                if (seleccionados.size() == 1) {
                    const std::string cuerpoJson =
                        "{\"status\":\"next\",\"nextPlayer\":2,\"unavailableId\":\"" +
                        std::string(IDS_PERSONAJES[indice]) + "\"}";
                    respuesta = respuestaHttp(
                        "200 OK", "application/json; charset=utf-8", cuerpoJson
                    );
                } else {
                    prepararInicioBatalla();
                    respuesta = respuestaHttp(
                        "200 OK",
                        "application/json; charset=utf-8",
                        estadoCombateJson(personajes, seleccionados, turno, visual)
                    );
                }
            }
        } else if (metodo == "POST" && ruta == "/api/combate/accion") {
            if (seleccionados.size() != 2) {
                respuesta = respuestaHttp(
                    "409 Conflict",
                    "application/json; charset=utf-8",
                    "{\"status\":\"error\",\"message\":\"Completa primero la seleccion\"}"
                );
            } else if (pendiente.activa) {
                respuesta = respuestaHttp(
                    "409 Conflict",
                    "application/json; charset=utf-8",
                    "{\"status\":\"error\",\"message\":\"Hay un impacto pendiente\"}"
                );
            } else if (!personajes[seleccionados[0]]->vive() ||
                       !personajes[seleccionados[1]]->vive()) {
                respuesta = respuestaHttp(
                    "409 Conflict",
                    "application/json; charset=utf-8",
                    "{\"status\":\"error\",\"message\":\"La batalla ya terminó\"}"
                );
            } else {
                const auto inicioCuerpo = solicitud.find("\r\n\r\n");
                const std::string cuerpo = inicioCuerpo == std::string::npos
                    ? std::string{}
                    : solicitud.substr(inicioCuerpo + 4);
                const std::string accion = valorFormulario(cuerpo, "action");

                Personaje& atacante = *personajes[seleccionados[turno]];
                const int puestoAtacante = turno + 1;
                const int puestoDefensor = (1 - turno) + 1;
                bool consumeTurno = false;

                visual.actor = puestoAtacante;
                visual.objetivo = puestoDefensor;
                visual.movimiento.clear();
                visual.mensajes.clear();
                visual.impactoPendiente = false;

                if (accion == "normal") {
                    atacante.setdefiende(false);
                    visual.efecto = "normal";
                    visual.movimiento = atacante.getNataque();
                    visual.mensajes = {
                        atacante.getNombre() + " utilizó " + atacante.getNataque() + "."
                    };
                    visual.impactoPendiente = true;
                    pendiente = {true, accion, turno};
                } else if (accion == "special") {
                    atacante.setdefiende(false);
                    if (atacante.getKi() < atacante.getKiEspecial()) {
                        visual.efecto = "sin-ki";
                        visual.mensajes = {
                            "No tienes suficiente KI para " + atacante.getNataqueEspecial() + ".",
                            "¿Qué hará " + atacante.getNombre() + "?"
                        };
                    } else {
                        visual.efecto = "especial";
                        visual.movimiento = atacante.getNataqueEspecial();
                        visual.mensajes = {
                            atacante.getNombre() + " utilizó " + atacante.getNataqueEspecial() + "."
                        };
                        visual.impactoPendiente = true;
                        pendiente = {true, accion, turno};
                    }
                } else if (accion == "defend") {
                    atacante.setdefiende(true);
                    atacante.setKi(atacante.getKi() + 10);
                    visual.efecto = "defensa";
                    visual.movimiento = "Defender";
                    visual.objetivo = puestoAtacante;
                    visual.mensajes = {
                        atacante.getNombre() + " se está defendiendo.",
                        "El próximo golpe contra " + atacante.getNombre() + " hará menos daño."
                    };
                    consumeTurno = true;
                } else if (accion == "charge") {
                    atacante.setdefiende(false);
                    const int kiAnterior = atacante.getKi();
                    atacante.setKi(atacante.getKi() + KI_POR_CARGA);
                    const int kiRecuperado = atacante.getKi() - kiAnterior;
                    visual.objetivo = puestoAtacante;
                    if (kiRecuperado == 0) {
                        visual.efecto = "ki-maximo";
                        visual.mensajes = {
                            "El KI de " + atacante.getNombre() + " ya está al máximo.",
                            "¿Qué hará " + atacante.getNombre() + "?"
                        };
                    } else {
                        visual.efecto = "carga-ki";
                        visual.movimiento = "Cargar KI";
                        visual.mensajes = {
                            atacante.getNombre() + " concentró su energía.",
                            atacante.getNombre() + " recuperó " +
                                std::to_string(kiRecuperado) + " puntos de KI."
                        };
                        consumeTurno = true;
                    }
                } else {
                    respuesta = respuestaHttp(
                        "400 Bad Request",
                        "application/json; charset=utf-8",
                        "{\"status\":\"error\",\"message\":\"Accion no valida\"}"
                    );
                }

                if (respuesta.empty()) {
                    visual.revision++;
                    if (consumeTurno) {
                        turno = 1 - turno;
                        personajes[seleccionados[turno]]->setdefiende(false);
                        visual.mensajes.push_back(
                            "¿Qué hará " + personajes[seleccionados[turno]]->getNombre() + "?"
                        );
                    }

                    respuesta = respuestaHttp(
                        "200 OK",
                        "application/json; charset=utf-8",
                        estadoCombateJson(personajes, seleccionados, turno, visual)
                    );
                }
            }
        } else if (metodo == "POST" && ruta == "/api/combate/impacto") {
            if (seleccionados.size() != 2 || !pendiente.activa || pendiente.turno != turno) {
                respuesta = respuestaHttp(
                    "409 Conflict",
                    "application/json; charset=utf-8",
                    "{\"status\":\"error\",\"message\":\"No hay un impacto válido pendiente\"}"
                );
            } else {
                Personaje& atacante = *personajes[seleccionados[turno]];
                Personaje& defensor = *personajes[seleccionados[1 - turno]];
                const int vidaAnterior = defensor.getHp();

                if (pendiente.accion == "normal") {
                    atacante.atacarNormal(defensor);
                    atacante.setKi(atacante.getKi() + 15);
                } else {
                    atacante.atacarEspecial(defensor);
                }

                const int dano = vidaAnterior - defensor.getHp();
                const bool fueEspecial = pendiente.accion == "special";
                pendiente = {};
                visual.impactoPendiente = false;
                visual.mensajes = {
                    (fueEspecial ? "¡Impacto especial! " : "¡Impacto! ") +
                        defensor.getNombre() + " recibió " + std::to_string(dano) +
                        " puntos de daño."
                };

                if (!defensor.vive()) {
                    visual.mensajes.push_back(
                        "¡" + atacante.getNombre() + " ha ganado la batalla!"
                    );
                } else {
                    turno = 1 - turno;
                    personajes[seleccionados[turno]]->setdefiende(false);
                    visual.mensajes.push_back(
                        "¿Qué hará " + personajes[seleccionados[turno]]->getNombre() + "?"
                    );
                }

                respuesta = respuestaHttp(
                    "200 OK",
                    "application/json; charset=utf-8",
                    estadoCombateJson(personajes, seleccionados, turno, visual)
                );
            }
        } else if (metodo == "POST" && ruta == "/api/combate/reiniciar") {
            if (seleccionados.size() != 2) {
                respuesta = respuestaHttp(
                    "409 Conflict",
                    "application/json; charset=utf-8",
                    "{\"status\":\"error\",\"message\":\"No hay una batalla para reiniciar\"}"
                );
            } else {
                const int siguienteRevision = visual.revision + 1;
                prepararInicioBatalla();
                visual.revision = siguienteRevision;
                visual.mensajes = {
                    "¡Revancha: " + personajes[seleccionados[0]]->getNombre() + " contra " +
                        personajes[seleccionados[1]]->getNombre() + "!",
                    "Vida, KI y estados restaurados.",
                    "¿Qué hará " + personajes[seleccionados[0]]->getNombre() + "?"
                };
                respuesta = respuestaHttp(
                    "200 OK",
                    "application/json; charset=utf-8",
                    estadoCombateJson(personajes, seleccionados, turno, visual)
                );
            }
        } else if (metodo == "POST" && ruta == "/api/seleccion/reiniciar") {
            reiniciarTodos();
            seleccionados.clear();
            respuesta = respuestaHttp(
                "200 OK",
                "application/json; charset=utf-8",
                "{\"status\":\"selecting\",\"player\":1,\"unavailableId\":null}"
            );
        } else if (metodo == "GET" &&
                   (ruta == "/api/estado" || ruta == "/api/combate/estado")) {
            if (seleccionados.size() < 2) {
                const std::string noDisponible = seleccionados.empty()
                    ? "null"
                    : "\"" + std::string(IDS_PERSONAJES[seleccionados.front()]) + "\"";
                const std::string cuerpoJson =
                    "{\"status\":\"selecting\",\"player\":" +
                    std::to_string(seleccionados.size() + 1) +
                    ",\"unavailableId\":" + noDisponible + "}";
                respuesta = respuestaHttp(
                    "200 OK", "application/json; charset=utf-8", cuerpoJson
                );
            } else {
                respuesta = respuestaHttp(
                    "200 OK",
                    "application/json; charset=utf-8",
                    estadoCombateJson(personajes, seleccionados, turno, visual)
                );
            }
        } else if (metodo == "GET" && ruta == "/favicon.ico") {
            respuesta = respuestaHttp("204 No Content", "image/x-icon", "");
        } else if (metodo == "GET" && rutaEstaticaValida(ruta) && ruta.find("..") == std::string::npos) {
            const std::string relativa = (ruta == "/" ? "index.html" : ruta.substr(1));
            const auto archivo = directorioPublico / relativa;
            const std::string contenido = leerArchivo(archivo);
            respuesta = contenido.empty()
                ? respuestaHttp("404 Not Found", "text/plain; charset=utf-8", "Recurso no encontrado")
                : respuestaHttp("200 OK", tipoMime(archivo), contenido);
        } else {
            respuesta = respuestaHttp("404 Not Found", "text/plain; charset=utf-8", "Ruta no encontrada");
        }

        enviarTodo(cliente, respuesta);
        cerrarSocket(cliente);
    }

    cerrarSocket(servidor);
#ifdef _WIN32
    WSACleanup();
#endif

    return {-1, -1, false};
}
