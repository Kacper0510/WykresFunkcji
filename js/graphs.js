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

// Wyświetla wykres danej funkcji (string) na danym elemencie typu canvas w przedziale od a do b
export function generate_graph(f, canvas, a, b) {
    f = parser.parse_to_rpn(f);
    const values = parser.calculate_graph_points(f, a, b, 1000);
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "green";

    const min = parser.calculate_minimum(values);
    const max = parser.calculate_maximum(values);
    // TODO linie wykresu (log_10)

    for (let i = 0; i < values.length - 1; i++) {
        const p1 = translate_point(canvas, a, b, min[1], max[1], values[i]);
        const p2 = translate_point(canvas, a, b, min[1], max[1], values[i + 1]);
        if (isFinite(values[i][1]) && isFinite(values[i + 1][1])) {
            draw_line(ctx, p1, p2);
        }
    }
}

// Wywoływane po kliknięciu "Generuj" na stronie głównej
// TODO catch, a == b
export function graphing_calculator_generate_onclick() {
    const rpn = document.getElementById("wzor").value;
    const canvas = document.getElementById("miejsce_wykres");
    generate_graph(rpn, canvas, -10, 10);
}
