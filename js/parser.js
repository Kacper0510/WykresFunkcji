"use strict";

function tymczasowe_onclick() {
    let rpn = parse_to_rpn(document.getElementById("wzor").value);
    document.getElementById("canvas_div").innerHTML = Array.from(calculate_graph_points(rpn, -10, 10, 20).entries()).toString();
}

const MNOZENIE_PRECEDENCJA = ["^", "*", "/"];
const DODAWANIE_PRECEDENCJA = ["^", "*", "/", "+", "-"];

// Zamiana tekstu na odwrotną notację polską, zwraca tablicę liczb i operatorów
// TODO implicit multiplication
function parse_to_rpn(text) {
    text = text.toLowerCase().trim();
    if (text[0] === "-") text = "0" + text;
    let aktualna_liczba = "0";
    let ostatni_lewy_nawias = 0;
    let wynik = [];
    let stos = [];
    for (let i = 0; i < text.length; i++) {
        let znak = text[i];
        if (znak === " ") continue;
        if (znak === ",") znak = ".";
        if (znak === "[") znak = "(";
        if (znak === "]") znak = ")";
        if ((znak >= "0" && znak <= "9") || znak === ".") {
            aktualna_liczba += znak;
        } else {
            if (aktualna_liczba.length > 1) {
                wynik.push(parseFloat(aktualna_liczba));
                aktualna_liczba = "0";
            }
            // TODO funkcje
            switch (znak) {
                case "x":
                    wynik.push("x");
                    break;
                case ")":
                    let znaleziono_nawias = false;
                    while (stos.length !== 0) {
                        let stos_top = stos.pop();
                        if (stos_top === "(") {
                            znaleziono_nawias = true;
                            break;
                        }
                        wynik.push(stos_top);
                    }
                    if (!znaleziono_nawias) throw "Błędny prawy nawias: znak nr " + (i + 1);
                    break;
                case "^":
                    while (stos.length !== 0 && stos[stos.length - 1] === "^") {
                        wynik.push(stos.pop());
                    }
                    stos.push(znak);
                    break;
                case "(":
                    stos.push(znak);
                    ostatni_lewy_nawias = i + 1;
                    break;
                case "*":
                case "/":
                    while (stos.length !== 0 && MNOZENIE_PRECEDENCJA.includes(stos[stos.length - 1])) {
                        wynik.push(stos.pop());
                    }
                    stos.push(znak);
                    break;
                case "+":
                case "-":
                    while (stos.length !== 0 && DODAWANIE_PRECEDENCJA.includes(stos[stos.length - 1])) {
                        wynik.push(stos.pop());
                    }
                    stos.push(znak);
                    break;
                default:
                    throw "Nieznany operator (znak nr " + (i + 1) + "): " + znak;
            }
        }
    }
    if (aktualna_liczba.length > 1) {
        wynik.push(parseFloat(aktualna_liczba));
    }
    while (stos.length !== 0) {
        let stos_top = stos.pop();
        if (stos_top === "(") {
            throw "Błędny lewy nawias: znak nr " + ostatni_lewy_nawias;
        }
        wynik.push(stos_top);
    }
    return wynik;
}

// Obliczanie wartości wyrażenia w formacie ONP dla danego x
function calculate_rpn(rpn, x) {
    let stos = [];
    let top;
    for (const symbol of rpn) {
        if (typeof symbol === "number") {
            stos.push(symbol);
        } else {
            switch (symbol) {
                case "x":
                    stos.push(x);
                    break;
                case "+":
                    top = stos.pop();
                    stos.push(stos.pop() + top);
                    break;
                case "-":
                    top = stos.pop();
                    stos.push(stos.pop() - top);
                    break;
                case "*":
                    top = stos.pop();
                    stos.push(stos.pop() * top);
                    break;
                case "/":
                    top = stos.pop();
                    stos.push(stos.pop() / top);
                    break;
                case "^":
                    top = stos.pop();
                    stos.push(stos.pop() ** top);
                    break;
            }
        }
    }
    if (stos.length > 1) {
        throw "Otrzymano za dużo liczb (czy nie napisałeś dwóch liczb pod rząd?)";
    }
    return stos[0];
}

// Zwraca mapę punktów w postaci x -> y w przedziale od a do b przy danej dokładności (dokładność = długość tablicy)
function calculate_graph_points(rpn, a, b, length) {
    let punkty = new Map();
    const dlugosc_przedzialow = Math.abs(a - b) / length;
    for (let i = Math.min(a, b); i <= Math.max(a, b) + 0.000000001; i += dlugosc_przedzialow) {
        punkty.set(i, calculate_rpn(rpn, i)); // TODO isFinite()
    }
    return punkty;
}
