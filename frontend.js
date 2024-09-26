let tasks = []; // Global olarak tanımlıyoruz

// Görevleri al ve ekrana render et
async function getTasks() {
    const response = await fetch('http://localhost:5001/tasks');
    return await response.json();
}

// Yeni görev oluştur
async function createTask(taskData) {
    await fetch('http://localhost:5001/tasks', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
    });
}

// Görevi güncelle
async function updateTask(taskId, taskData) {
    await fetch(`http://localhost:5001/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(taskData)
    });
}

// Görevleri ekranda göster
async function renderTasks(departmentFilter = 'All', processFilter = 'All') {
    tasks = await getTasks(); // Görevleri global değişken olan tasks'a atıyoruz
    console.log(tasks); // Görevleri görmek için

    const todoTasks = document.getElementById('todoTasks');
    const inProgressTasks = document.getElementById('inProgressTasks');
    const completedTasks = document.getElementById('completedTasks');

    todoTasks.innerHTML = '';
    inProgressTasks.innerHTML = '';
    completedTasks.innerHTML = '';

    tasks.forEach(task => {
        if (departmentFilter !== 'All' && task.department !== departmentFilter) return;
        if (processFilter !== 'All' && task.process !== processFilter) return;

        const li = document.createElement('li');
        li.setAttribute('draggable', true);
        li.setAttribute('ondragstart', 'drag(event)');
        li.setAttribute('id', task._id);
        li.onclick = function() { editTask(tasks.indexOf(task)); }; // Artık tasks global olduğu için sorun çözülmeli

        li.innerHTML = `
            <div class="task-title">${task.process} (${task.processType})</div>
            <div class="task-id">ID: ${task._id}</div>
            <div class="task-details">
                Department: ${task.department} <br>
                Stakeholders: ${task.stakeholders || "N/A"} <br>
                Start: ${task.startDate} | Due: ${task.dueDate} <br>
                <a href="${task.projectFolder || '#'}" target="_blank">${task.projectFolder ? "Project Documentation" : "No Documentation"}</a>
            </div>
        `;

        if (task.status === 'To Do') {
            todoTasks.appendChild(li);
        } else if (task.status === 'In Progress') {
            inProgressTasks.appendChild(li);
        } else if (task.status === 'Completed') {
            completedTasks.appendChild(li);
        }
    });
}

// Görevi düzenlemek için formu doldur ve modalı aç
function editTask(index) {
    const task = tasks[index]; // Artık tasks global
    document.getElementById('department').value = task.department;
    document.getElementById('process').value = task.process;
    document.getElementById('processType').value = task.processType;
    document.getElementById('stakeholders').value = task.stakeholders || '';
    document.getElementById('startDate').value = task.startDate;
    document.getElementById('dueDate').value = task.dueDate;
    document.getElementById('projectFolder').value = task.projectFolder || '';
    
    // Modalı aç
    document.getElementById("taskModal").style.display = "block"; 
}

// "+" butonuna basıldığında görev ekleme modunu aç
document.getElementById('addTaskBtn').addEventListener('click', function() {
    document.getElementById("taskModal").style.display = "block";
});

// Modal pencereyi kapatma fonksiyonu
document.querySelector('.close').addEventListener('click', function() {
    document.getElementById("taskModal").style.display = "none";
});

// Görev ekleme formu gönderildiğinde MongoDB'ye kaydet
document.getElementById("taskForm").addEventListener("submit", async function(event) {
    event.preventDefault();

    const task = {
        department: document.getElementById('department').value,
        process: document.getElementById('process').value,
        processType: document.getElementById('processType').value,
        stakeholders: document.getElementById('stakeholders').value,
        startDate: document.getElementById('startDate').value,
        dueDate: document.getElementById('dueDate').value,
        projectFolder: document.getElementById('projectFolder').value,
        status: 'To Do'
    };

    await createTask(task); // MongoDB'ye yeni görev ekle
    renderTasks();
    renderDepartmentList();
    document.getElementById("taskModal").style.display = "none"; // Modal pencereyi kapat
});

// Departman listesi ve filtreleme
function renderDepartmentList() {
    const departments = {};

    getTasks().then(tasks => {
        tasks.forEach(task => {
            if (!departments[task.department]) {
                departments[task.department] = new Set();
            }
            departments[task.department].add(task.process);
        });

        const departmentList = document.getElementById('departmentList');
        departmentList.innerHTML = '<li onclick="filterTasks(\'All\')">All</li>';

        Object.keys(departments).forEach(department => {
            const departmentItem = document.createElement('li');
            departmentItem.textContent = department;
            departmentItem.onclick = function() {
                departmentItem.classList.toggle('active');
                filterTasks(department);
            };

            const processList = document.createElement('ul');
            processList.style.display = 'none'; // Başlangıçta gizle
            departments[department].forEach(process => {
                const processItem = document.createElement('li');
                processItem.textContent = process;
                processItem.classList.add('process-item');
                processItem.onclick = function(event) {
                    event.stopPropagation(); // Departmana tıklama etkisini engelle
                    filterTasks(department, process); 
                };
                processList.appendChild(processItem);
            });

            departmentItem.appendChild(processList);
            departmentList.appendChild(departmentItem);

            // Tıklandığında süreç listesini açıp kapama işlemi
            departmentItem.addEventListener('click', () => {
                processList.style.display = processList.style.display === 'none' ? 'block' : 'none';
            });
        });
    });
}

// Görev filtreleme
function filterTasks(department, process = 'All') {
    renderTasks(department, process);
}

// Sürükle ve bırak işlemi
function allowDrop(ev) {
    ev.preventDefault();
}

function drag(ev) {
    ev.dataTransfer.setData("text", ev.target.id);
}

function drop(ev) {
    ev.preventDefault();
    const data = ev.dataTransfer.getData("text");
    const taskElement = document.getElementById(data);
    const column = ev.target.closest(".column");
    const status = column.id === 'todo' ? 'To Do' :
                   column.id === 'inprogress' ? 'In Progress' : 'Completed';

    const taskId = taskElement.id;
    const task = {
        status: status
    };

    updateTask(taskId, task).then(() => {
        renderTasks();
    });
}

// Sayfa yüklendiğinde
window.onload = function() {
    renderTasks();
    renderDepartmentList(); // Departman listesi ekrana gelir
};
