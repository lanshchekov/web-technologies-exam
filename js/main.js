import { apiRequest } from "./api.js";
import { showAlert, paginate } from "./utils.js";

let currentPage = 1;
const PER_PAGE = 5;

let courses = [];
let tutors = [];
let page = 1;

let allCourses = [];

apiRequest("/courses").then(data => {
    allCourses = data;
    courses = data;
    renderCourses();
});

let allTutors = [];

apiRequest("/tutors").then(data => {
    allTutors = data;
    tutors = data;
    renderTutors();
});

function renderCourses() {
    const table = document.getElementById("coursesTable");
    const pagination = document.getElementById("coursePagination");

    table.innerHTML = "";
    pagination.innerHTML = "";

    const totalPages = Math.ceil(courses.length / PER_PAGE);
    const start = (currentPage - 1) * PER_PAGE;
    const pageCourses = courses.slice(start, start + PER_PAGE);

    pageCourses.forEach(course => {
        table.innerHTML += `
        <tr>
          <td>${course.name}</td>
          <td>${course.level}</td>
          <td>${course.teacher}</td>
          <td>
            <button class="btn btn-outline-primary btn-sm"
              onclick="openCourseOrder(${course.id})">
              Подать заявку
            </button>
          </td>
        </tr>`;
    });

    // Кнопка "Назад"
    pagination.innerHTML += `
      <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
        <a class="page-link" href="#"
          onclick="changePage(${currentPage - 1})">
          Назад
        </a>
      </li>
    `;

    // Номера страниц
    for (let i = 1; i <= totalPages; i++) {
        pagination.innerHTML += `
          <li class="page-item ${i === currentPage ? "active" : ""}">
            <a class="page-link" href="#"
              onclick="changePage(${i})">
              ${i}
            </a>
          </li>
        `;
    }

    // Кнопка "Вперёд"
    pagination.innerHTML += `
      <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link" href="#"
          onclick="changePage(${currentPage + 1})">
          Вперёд
        </a>
      </li>
    `;
}

window.changePage = function (page) {
    const totalPages = Math.ceil(courses.length / PER_PAGE);
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    renderCourses();
};

document.getElementById("courseSearch")
  .addEventListener("input", e => {
    const value = e.target.value.toLowerCase();
    courses = allCourses.filter(c =>
        c.name.toLowerCase().includes(value)
    );
    currentPage = 1;
    renderCourses();
});

let selectedCourse = null;
let modal = new bootstrap.Modal(
    document.getElementById("courseOrderModal")
);

window.openCourseOrder = function (courseId) {
    selectedCourse = courses.find(c => c.id === courseId);

    document.getElementById("courseName").value = selectedCourse.name;
    document.getElementById("courseTeacher").value = selectedCourse.teacher;

    // Даты
    const dateSelect = document.getElementById("startDate");
    dateSelect.innerHTML = `<option value="">Выберите дату</option>`;

    selectedCourse.start_dates.forEach(d => {
        const date = d.split("T")[0];
        dateSelect.innerHTML += `<option value="${date}">${date}</option>`;
    });

    document.getElementById("startTime").innerHTML = "";
    document.getElementById("startTime").disabled = true;

    document.getElementById("durationInfo").value =
        `${selectedCourse.total_length} недель`;

    updatePrice();
    modal.show();
};

document.getElementById("startDate").addEventListener("change", e => {
    const timeSelect = document.getElementById("startTime");
    timeSelect.innerHTML = "";
    timeSelect.disabled = false;

    selectedCourse.start_dates
        .filter(d => d.startsWith(e.target.value))
        .forEach(d => {
            const start = d.split("T")[1].slice(0, 5);
            const endHour =
                parseInt(start.split(":")[0]) + selectedCourse.week_length;
            const end = `${endHour}:00`;

            timeSelect.innerHTML += `
              <option value="${start}">
                ${start} – ${end}
              </option>`;
        });

    updatePrice();
});

function updatePrice() {
    if (!selectedCourse) return;

    const persons = +document.getElementById("persons").value;

    let hours =
        selectedCourse.total_length * selectedCourse.week_length;

    let price =
        selectedCourse.course_fee_per_hour * hours * persons;

    if (document.getElementById("supplementary").checked)
        price += 2000 * persons;

    if (document.getElementById("personalized").checked)
        price += 1500 * selectedCourse.total_length;

    if (document.getElementById("excursions").checked)
        price *= 1.25;

    if (document.getElementById("interactive").checked)
        price *= 1.5;

    document.getElementById("totalPrice").value =
        Math.round(price) + " ₽";
}

["persons", "supplementary", "personalized", "excursions", "interactive"]
    .forEach(id =>
        document.getElementById(id)
            .addEventListener("change", updatePrice)
    );

document.getElementById("submitOrder").onclick = async () => {
    const body = {
        course_id: selectedCourse.id,
        date_start: document.getElementById("startDate").value,
        time_start: document.getElementById("startTime").value,
        duration:
          selectedCourse.total_length * selectedCourse.week_length,
        persons: +document.getElementById("persons").value,
        price: parseInt(document.getElementById("totalPrice").value),
        supplementary: document.getElementById("supplementary").checked,
        personalized: document.getElementById("personalized").checked,
        excursions: document.getElementById("excursions").checked,
        interactive: document.getElementById("interactive").checked
    };

    await apiRequest("/orders", "POST", body);
    showAlert("Заявка успешно оформлена");
    modal.hide();
};


function renderTutors() {
    const body = document.getElementById("tutorsTable");
    body.innerHTML = "";
    tutors.forEach(t => {
        body.innerHTML += `
        <tr>
            <td>${t.name}</td>
            <td>${t.language_level}</td>
            <td>${t.work_experience}</td>
            <td>${t.price_per_hour}</td>
            <td>
            <button class="btn btn-outline-primary btn-sm"
                onclick="openTutorOrder(${t.id})">
                Выбрать
            </button>
            </td>
        </tr>`;
    });
}

const levelSelect = document.getElementById("levelFilter");
const expInput = document.getElementById("experienceFilter");

levelSelect.addEventListener("change", applyTutorFilters);
expInput.addEventListener("input", applyTutorFilters);

function applyTutorFilters() {
    const level = levelSelect.value;
    const minExp = expInput.value
        ? parseInt(expInput.value)
        : 0;

    tutors = allTutors.filter(tutor => {
        const levelMatch =
            !level || tutor.language_level === level;

        const expMatch =
            tutor.work_experience >= minExp;

        return levelMatch && expMatch;
    });

    renderTutors();
}

let selectedTutor = null;
const tutorModal = new bootstrap.Modal(
    document.getElementById("tutorOrderModal")
);

window.openTutorOrder = function (tutorId) {
    selectedTutor = tutors.find(t => t.id === tutorId);

    document.getElementById("tutorName").value = selectedTutor.name;
    document.getElementById("tutorLevel").value = selectedTutor.language_level;
    document.getElementById("tutorLanguages").value =
        selectedTutor.languages_spoken.join(", ");
    document.getElementById("tutorExperience").value =
        selectedTutor.work_experience;
    document.getElementById("tutorPrice").value =
        selectedTutor.price_per_hour + " ₽";

    updateTutorPrice();
    tutorModal.show();
};

function updateTutorPrice() {
    if (!selectedTutor) return;

    const duration =
        +document.getElementById("tutorDuration").value;
    const persons =
        +document.getElementById("tutorPersons").value;

    const price =
        selectedTutor.price_per_hour * duration * persons;

    document.getElementById("tutorTotalPrice").value =
        price + " ₽";
}

["tutorDuration", "tutorPersons"].forEach(id =>
    document.getElementById(id)
        .addEventListener("input", updateTutorPrice)
);

document.getElementById("submitTutorOrder").onclick = async () => {
    const body = {
        tutor_id: selectedTutor.id,
        date_start: document.getElementById("tutorDate").value,
        time_start: document.getElementById("tutorTime").value,
        duration: +document.getElementById("tutorDuration").value,
        persons: +document.getElementById("tutorPersons").value,
        price: parseInt(
          document.getElementById("tutorTotalPrice").value
        )
    };

    await apiRequest("/orders", "POST", body);
    showAlert("Заявка к репетитору оформлена");
    tutorModal.hide();
};

