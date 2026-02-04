export function showAlert(text, type = "success") {
    const area = document.getElementById("alerts");
    const div = document.createElement("div");
    div.className = `alert alert-${type}`;
    div.textContent = text;
    area.appendChild(div);
    setTimeout(() => div.remove(), 5000);
}

export function paginate(data, page, perPage = 5) {
    const start = (page - 1) * perPage;
    return data.slice(start, start + perPage);
}

export function calculatePrice(course, opts) {
    let base =
        course.course_fee_per_hour *
        (course.total_length * course.week_length);

    if (opts.weekend) base *= 1.5;
    if (opts.morning) base += 400;
    if (opts.evening) base += 1000;
    if (opts.intensive) base *= 1.2;
    if (opts.excursions) base *= 1.25;
    if (opts.interactive) base *= 1.5;

    if (opts.early) base *= 0.9;
    if (opts.group) base *= 0.85;

    base += opts.supplementary ? 2000 * opts.persons : 0;
    base += opts.personalized ? 1500 * course.total_length : 0;
    base += opts.assessment ? 300 : 0;

    return Math.round(base * opts.persons);
}
