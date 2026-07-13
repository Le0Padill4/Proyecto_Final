cmake_minimum_required(VERSION 3.16)

project(ProyectoFinal LANGUAGES CXX)

add_executable(juego
    src/main.cpp
    src/seleccion_personajes.cpp
    src/personajes/personaje.cpp
    src/personajes/Sexitar.cpp
    src/personajes/François.cpp
    src/personajes/leo1.cpp
    src/personajes/leo2.cpp
)

target_compile_features(juego PRIVATE cxx_std_17)
target_include_directories(juego PRIVATE src/headers)
target_compile_definitions(juego PRIVATE PROYECTO_PUBLIC_DIR="${CMAKE_SOURCE_DIR}/public")

if(WIN32)
    target_link_libraries(juego PRIVATE ws2_32)
endif()
