const API_BASE = "http://exam-api-courses.std-900.ist.mospolytech.ru/api";
const API_KEY = "c7f8b838-299b-40ed-8a41-3384fc3c751b";

export async function apiRequest(url, method = "GET", body = null) {
    const options = {
        method,
        headers: { "Content-Type": "application/json" }
    };
    if (body) options.body = JSON.stringify(body);

    const sep = url.includes("?") ? "&" : "?";
    const response = await fetch(
        `${API_BASE}${url}${sep}api_key=${API_KEY}`,
        options
    );
    return response.json();
}
