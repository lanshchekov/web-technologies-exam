import { apiRequest } from "./api.js";
import { showAlert } from "./utils.js";

apiRequest("/orders").then(data => {
    const body = document.getElementById("ordersTable");
    data.forEach((o, i) => {
        body.innerHTML += `
        <tr>
            <td>${i+1}</td>
            <td>${o.course_id || o.tutor_id}</td>
            <td>${o.date_start}</td>
            <td>${o.price}</td>
            <td>
                <button class="btn btn-danger btn-sm" onclick="del(${o.id})">Удалить</button>
            </td>
        </tr>`;
    });
});

window.del = function(id) {
    if (!confirm("Удалить заявку?")) return;
    apiRequest(`/orders/${id}`, "DELETE")
        .then(() => {
            showAlert("Заявка удалена");
            location.reload();
        });
};
