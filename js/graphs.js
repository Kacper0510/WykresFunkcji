import * as parser from "./parser.js";

// Zwraca koordynaty punktu na canvasie biorąc pod uwagę jego wymiary i rozpiętość wykresu
function translate_point(canvas, min_x, max_x, min_y, max_y, point) {
    const translated_x = ((point[0] - min_x) / (max_x - min_x)) * canvas.width;
    const translated_y = ((max_y - point[1]) / (max_y - min_y)) * canvas.height;
    return [translated_x, translated_y];
}

// Rysuje linię między dwoma punktami na danym kontekście canvasa
function draw_line(ctx, p1, p2) {
    ctx.beginPath();
    ctx.moveTo(...p1);
    ctx.lineTo(...p2);
    ctx.stroke();
    ctx.closePath();
}

// Wyświetla wykres danej funkcji (string) na danym elemencie typu canvas w przedziale od a do b. Zwraca minima, maksima i miejsca zerowe.
export function generate_graph(f, canvas, a, b) {
    f = parser.parse_to_rpn(f);
    const values = parser.calculate_graph_points(f, a, b, 1000);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "12px Roboto";
    ctx.fillStyle = "gray";

    // Granice y
    const minima = parser.calculate_minimum(values);
    const maxima = parser.calculate_maximum(values);
    let magnitude, min, max;
    if (Math.abs(maxima[1] - minima[1]) < parser.EPS) {
        magnitude = 0;
        min = minima[1] - 10;
        max = min + 20;
    } else if (isFinite(minima[1]) && isFinite(maxima[1])) {
        magnitude = Math.floor(Math.log10(maxima[1] - minima[1]));
        min = minima[1] - 10 ** magnitude;
        max = maxima[1] + 10 ** magnitude;
    } else { // Nie wiem, czy jest lepszy sposób na zapobieganie problemowi z 1/x
        magnitude = 1;
        min = -100;
        max = 100;
    }

    // Siatka
    ctx.lineWidth = 1;
    ctx.strokeStyle = "gray";
    let step = 10 ** magnitude;
    for (let i = Math.round(min / step) * step; i <= Math.round(max / step) * step + parser.EPS; i += step) {
        const p = translate_point(canvas, a, b, min, max, [0, i]);
        draw_line(ctx, [0, p[1]], [canvas.width, p[1]]);
        ctx.fillText(i, 5, p[1] - 3);
    }
    step = 10 ** Math.floor(Math.log10(b - a));
    for (let i = Math.round(a / step) * step; i <= Math.round(b / step) * step + parser.EPS; i += step) {
        const p = translate_point(canvas, a, b, min, max, [i, 0]);
        draw_line(ctx, [p[0], 0], [p[0], canvas.height]);
        ctx.fillText(i, p[0] + 3, 10);
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = "black";
    const poczatek_ukladu = translate_point(canvas, a, b, min, max, [0, 0]);
    draw_line(ctx, [poczatek_ukladu[0], 0], [poczatek_ukladu[0], canvas.height]);
    draw_line(ctx, [0, poczatek_ukladu[1]], [canvas.width, poczatek_ukladu[1]]);

    // Rysowanie wykresu
    ctx.lineWidth = 3;
    ctx.strokeStyle = "green";
    for (let i = 0; i < values.length - 1; i++) {
        const p1 = translate_point(canvas, a, b, min, max, values[i]);
        const p2 = translate_point(canvas, a, b, min, max, values[i + 1]);
        if (isFinite(values[i][1]) && isFinite(values[i + 1][1])) {
            draw_line(ctx, p1, p2);
        }
    }

    // Ekstrema, miejsca zerowe
    ctx.fillStyle = "blue";
    if (minima[0] !== Infinity) {
        for (const m of minima[0]) {
            const p = translate_point(canvas, a, b, min, max, [m, minima[1]]);
            ctx.fillRect(p[0] - 4, p[1] - 4, 8, 8);
        }
    }
    if (maxima[0] !== Infinity) {
        for (const m of maxima[0]) {
            const p = translate_point(canvas, a, b, min, max, [m, maxima[1]]);
            ctx.fillRect(p[0] - 4, p[1] - 4, 8, 8);
        }
    }
    let miejsca_zerowe = parser.calculate_solutions(values);
    if (miejsca_zerowe !== Infinity && miejsca_zerowe.length > 0) {
        ctx.fillStyle = "red";
        for (const mz of miejsca_zerowe) {
            const p = translate_point(canvas, a, b, min, max, [mz, 0]);
            ctx.fillRect(p[0] - 4, p[1] - 4, 8, 8);
        }
    }
    return [minima, maxima, miejsca_zerowe];
}

// Wywoływane po kliknięciu "Generuj" na stronie głównej
export function graphing_calculator_generate_onclick() {
    try {
        const f = document.getElementById("wzor").value;
        if (f.length === 0) {
            throw "Wzór nie może być pusty";
        }
        const a = parseFloat(document.getElementById("przedzial_dolny").value);
        const b = parseFloat(document.getElementById("przedzial_gorny").value);
        if (a >= b) {
            throw "Początek przedziału nie może być większy lub równy jego końcowi";
        }
        const canvas = document.getElementById("miejsce_wykres");
        const [minima, maxima, mz] = generate_graph(f, canvas, a, b);
        if (mz === Infinity) {
            document.getElementById("miejsca_zerowe_output").innerHTML = "nieskończenie wiele";
        } else if (mz.length === 0) {
            document.getElementById("miejsca_zerowe_output").innerHTML = "brak";
        } else {
            document.getElementById("miejsca_zerowe_output").innerHTML = mz.join(", ");
        }
        document.getElementById("minima_y").innerHTML = minima[1];
        if (minima[0] === Infinity) {
            document.getElementById("minima_output").innerHTML = "nieskończenie wiele";
        } else {
            document.getElementById("minima_output").innerHTML = minima[0].join(", ");
        }
        document.getElementById("maxima_y").innerHTML = maxima[1];
        if (maxima[0] === Infinity) {
            document.getElementById("maxima_output").innerHTML = "nieskończenie wiele";
        } else {
            document.getElementById("maxima_output").innerHTML = maxima[0].join(", ");
        }
        document.getElementById("div_blad").hidden = true;
    } catch (e) {
        document.getElementById("komunikat_bledu").innerHTML = e;
        document.getElementById("div_blad").hidden = false;
    }
}
