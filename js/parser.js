const MNOZENIE_PRECEDENCJA = ["^", "*", "/"];
const DODAWANIE_PRECEDENCJA = ["^", "*", "/", "+", "-"];

// Epsilon w dwóch postaciach: ułamek oraz liczba miejsc po przecinku
export const EPS = 0.00000001;
const EPS_DP = -Math.log10(EPS);

const FUNKCJE = [
    ["abs", Math.abs],
    ["sin", Math.sin],
    ["cos", Math.cos],
    ["tg", Math.tan],
    ["tan", Math.tan],
    ["ctg", Math.cot],
    ["cot", Math.cot],
    ["sqrt", Math.sqrt],
    ["cbrt", Math.cbrt],
    ["exp", Math.exp],
    ["ln", Math.log],
    ["log", Math.log10],
    ["log10", Math.log10],
    ["log2", Math.log2]
];

// Zamiana tekstu na odwrotną notację polską, zwraca tablicę liczb i operatorów
// TODO implicit multiplication
export function parse_to_rpn(text) {
    text = text.toLowerCase().trim();
    if (text[0] === "-") text = "0" + text;
    let aktualna_liczba = "0";
    let ostatni_lewy_nawias = 0;
    let wynik = [];
    let stos = [];
    nastepny_znak: for (let i = 0; i < text.length; i++) {
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
            if (text.startsWith("pi", i)) {
                wynik.push(Math.PI);
                i += 1;
                continue;
            }
            for (const f of FUNKCJE) {
                if (text.startsWith(f[0], i)) {
                    stos.push(f[1]);
                    i += f[0].length - 1;
                    continue nastepny_znak;
                }
            }
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
                    if (typeof stos[stos.length - 1] === "function") {
                        wynik.push(stos.pop());
                    }
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
        } else if (typeof symbol === "function") {
            stos.push(symbol(stos.pop()));
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

// Zwraca tablicę punktów w postaci [x, y] w przedziale od a do b przy danej dokładności (dokładność = długość tablicy)
export function calculate_graph_points(rpn, a, b, length) {
    let punkty = [];
    const dlugosc_przedzialow = Math.abs(a - b) / length;
    for (let i = Math.min(a, b); i <= Math.max(a, b) + EPS; i += dlugosc_przedzialow) {
        const i_eps = parseFloat(i.toFixed(EPS_DP));
        punkty.push([i_eps, calculate_rpn(rpn, i_eps)]);
    }
    return punkty;
}

// Zwraca tablicę miejsc zerowych, gdzie każde z nich ma postać liczby lub przedziału [x1, x2]
export function calculate_solutions(graph_points) {
    let miejsca_zerowe = [];
    let poprzednia_wartosc = NaN;
    for (let i = 0; i < graph_points.length; i++) {
        const p = graph_points[i];
        if (Math.abs(p[1]) < EPS) {
            miejsca_zerowe.push(p[0]);
            if (Math.abs(poprzednia_wartosc) < EPS) {
                return Infinity;
            }
        } else if (poprzednia_wartosc * p[1] < 0) {
            miejsca_zerowe.push(p[0]);
        }
        poprzednia_wartosc = p[1];
    }
    return miejsca_zerowe;
}

// Zwraca tablicę wartości minimalnych funkcji w danym przedziale oraz jej wartość w tych miejscach
export function calculate_minimum(graph_points) {
    const min = Math.min(...graph_points.map(x => x[1]).filter(x => !isNaN(x)));
    let min_tablica = [];
    let poprzednia_wartosc = NaN;
    for (let i = 0; i < graph_points.length; i++) {
        const p = graph_points[i];
        if (Math.abs(p[1] - min) < EPS) {
            min_tablica.push(p[0]);
            if (Math.abs(poprzednia_wartosc - p[1]) < EPS) {
                return [Infinity, min];
            }
        }
        poprzednia_wartosc = p[1];
    }
    return [min_tablica, min];
}

// Zwraca tablicę wartości maksymalnych funkcji w danym przedziale oraz jej wartość w tych miejscach
export function calculate_maximum(graph_points) {
    const max = Math.max(...graph_points.map(x => x[1]).filter(x => !isNaN(x)));
    // RIP moje jednolinijkowe arcydzieło (f*** you, przedziały maksimów)
    // const max_tablica = graph_points.filter(x => abs(x - max) < EPS);
    let max_tablica = [];
    let poprzednia_wartosc = NaN;
    for (let i = 0; i < graph_points.length; i++) {
        const p = graph_points[i];
        if (Math.abs(p[1] - max) < EPS) {
            max_tablica.push(p[0]);
            if (Math.abs(poprzednia_wartosc - p[1]) < EPS) {
                return [Infinity, max];
            }
        }
        poprzednia_wartosc = p[1];
    }
    return [max_tablica, max];
}
