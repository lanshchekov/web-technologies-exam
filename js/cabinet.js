import { apiRequest } from "./api.js";
import { showAlert } from "./utils.js";

let ordersCache = [];
let currentPage = 1;
const perPage = 5;

const tableBody = document.getElementById("ordersTable");
const pagination = document.getElementById("ordersPagination");
const editModal = new bootstrap.Modal(document.getElementById("editModal"));

async function loadOrders() {
    ordersCache = await apiRequest("/orders");
    currentPage = 1;
    renderOrders();
    renderPagination();
}

async function renderOrders() {
    tableBody.innerHTML = "";

    const start = (currentPage - 1) * perPage;
    const pageOrders = ordersCache.slice(start, start + perPage);

    for (let i = 0; i < pageOrders.length; i++) {
        const o = pageOrders[i];
        let title = "—";

        if (o.course_id) {
            const c = await apiRequest(`/courses/${o.course_id}`);
            title = c.name;
        }

        if (o.tutor_id) {
            const t = await apiRequest(`/tutors/${o.tutor_id}`);
            title = t.name;
        }

        tableBody.innerHTML += `
        <tr>
            <td>${start + i + 1}</td>
            <td>${title}</td>
            <td>${o.date_start}</td>
            <td>${o.price}</td>
            <td>
                <button class="btn btn-warning btn-sm me-2"
                        onclick="editOrder(${o.id})">
                    Изменить
                </button>
                <button class="btn btn-danger btn-sm"
                        onclick="del(${o.id})">
                    Удалить
                </button>
            </td>
        </tr>`;
    }
}

function renderPagination() {
    pagination.innerHTML = "";

    const totalPages = Math.ceil(ordersCache.length / perPage);

    if (totalPages <= 1) return;

    // Назад
    pagination.innerHTML += `
      <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
        <a class="page-link" href="#" onclick="changePage(${currentPage - 1})">
          Назад
        </a>
      </li>`;

    // Номера страниц
    for (let i = 1; i <= totalPages; i++) {
        pagination.innerHTML += `
          <li class="page-item ${i === currentPage ? "active" : ""}">
            <a class="page-link" href="#" onclick="changePage(${i})">
              ${i}
            </a>
          </li>`;
    }

    // Вперёд
    pagination.innerHTML += `
      <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link" href="#" onclick="changePage(${currentPage + 1})">
          Вперёд
        </a>
      </li>`;
}

window.changePage = function (page) {
    const totalPages = Math.ceil(ordersCache.length / perPage);
    if (page < 1 || page > totalPages) return;

    currentPage = page;
    renderOrders();
    renderPagination();
};

loadOrders();

window.editOrder = async function (id) {
    const order = ordersCache.find(o => o.id === id);

    document.getElementById("editOrderId").value = order.id;
    document.getElementById("editDate").value = order.date_start;
    document.getElementById("editTime").value = order.time_start;
    document.getElementById("editPrice").value = order.price;

    // Информация о курсе / репетиторе
    let title = "";
    let description = "";

    if (order.course_id) {
        const course = await apiRequest(`/courses/${order.course_id}`);
        title = course.name;
        description = course.description;
    }

    if (order.tutor_id) {
        const tutor = await apiRequest(`/tutors/${order.tutor_id}`);
        title = tutor.name;
        description =
            `Уровень: ${tutor.language_level}\n` +
            `Опыт: ${tutor.work_experience} лет\n` +
            `Языки: ${tutor.languages_offered.join(", ")}`;
    }

    document.getElementById("editTitle").value = title;
    document.getElementById("editDescription").value = description;

    document.getElementById("editError").classList.add("d-none");
    editModal.show();
};

document.getElementById("saveEdit").addEventListener("click", async () => {
    const id = document.getElementById("editOrderId").value;

    const date = document.getElementById("editDate").value;
    const time = document.getElementById("editTime").value;

    if (!date || !time) {
        const err = document.getElementById("editError");
        err.textContent = "Заполните дату и время начала занятий";
        err.classList.remove("d-none");
        return;
    }

    const data = {
        date_start: date,
        time_start: time
    };

    try {
        await apiRequest(`/orders/${id}`, "PUT", data);
        editModal.hide();
        showAlert("Заявка успешно обновлена", "success");
        loadOrders();
    } catch (e) {
        showAlert("Ошибка при обновлении заявки", "danger");
    }
});

window.del = async function (id) {
    if (!confirm("Вы уверены, что хотите удалить заявку?")) return;
    await apiRequest(`/orders/${id}`, "DELETE");
    showAlert("Заявка удалена", "success");
    loadOrders();
};
