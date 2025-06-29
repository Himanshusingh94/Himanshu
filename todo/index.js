$(document).ready(function() {
    const todoList = $("#todo-list");
    const newTodoItemInput = $("#new-todo-item");
    const addTaskBtn = $("#add-task-btn");
    const prioritySelect = $("#priority-select");
    const dueDateInput = $("#due-date-input");
    const colorTagInput = $("#color-tag-input");
    const emptyState = $(".empty-state");
    const clearCompletedBtn = $("#clear-completed-btn");
    const filterButtons = $(".filter-options button");
    const searchBox = $("#search-tasks");
    const darkModeToggle = $("#dark-mode-toggle");
    let todos = [];
    let currentFilter = localStorage.getItem("todo_filter") || "all";
    let darkMode = localStorage.getItem("todo_dark_mode") === "true";

    // --- Helper Functions ---
    function generateUniqueId() {
        return '_' + Math.random().toString(36).substr(2, 9);
    }
    function saveTodos() {
        localStorage.setItem("todos", JSON.stringify(todos));
    }
    function saveFilter(filter) {
        localStorage.setItem("todo_filter", filter);
    }
    function loadTodos() {
        const storedTodos = localStorage.getItem("todos");
        if (storedTodos) {
            todos = JSON.parse(storedTodos);
        }
        renderTodos(currentFilter, searchBox.val().trim());
    }
    function toggleEmptyState(filteredCount) {
        if (todos.length === 0 || filteredCount === 0) {
            emptyState.fadeIn(130);
        } else {
            emptyState.fadeOut(90);
        }
    }
    // --- Date Formatting ---
    function formatDateLabel(dateStr) {
        if (!dateStr) return '';
        const today = new Date();
        const input = new Date(dateStr);
        today.setHours(0,0,0,0);
        input.setHours(0,0,0,0);
        const diff = Math.round((input - today) / (1000*60*60*24));
        if (diff === 0) return "Today";
        if (diff === 1) return "Tomorrow";
        if (diff === -1) return "Yesterday";
        if (diff < 0) return `Overdue`;
        return input.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
    }
    function isOverdue(dateStr, completed) {
        if (!dateStr || completed) return false;
        const today = new Date(); today.setHours(0,0,0,0);
        const input = new Date(dateStr); input.setHours(0,0,0,0);
        return input < today;
    }

    // --- Render Todos ---
    function renderTodos(filter = "all", searchVal = "") {
        todoList.empty();
        let filteredTodos = todos;
        if (filter === "active") {
            filteredTodos = todos.filter(todo => !todo.completed);
        } else if (filter === "completed") {
            filteredTodos = todos.filter(todo => todo.completed);
        }
        if (searchVal) {
            const s = searchVal.toLowerCase();
            filteredTodos = filteredTodos.filter(todo =>
                todo.text.toLowerCase().includes(s) ||
                (todo.colorTag && todo.colorTag.toLowerCase().includes(s))
            );
        }
        toggleEmptyState(filteredTodos.length);
        filteredTodos.forEach(todo => {
            const dateLabel = formatDateLabel(todo.dueDate);
            const overdue = isOverdue(todo.dueDate, todo.completed) ? "overdue" : "";
            const dueDateHtml = todo.dueDate ? `<span class="due-date ${overdue}">${dateLabel}</span>` : "";
            const colorTagHtml = todo.colorTag ? `<span class="color-tag" style="background:${colorFromTag(todo.colorTag)}">${escapeHtml(todo.colorTag)}</span>` : "";
            const noteHtml = todo.note ? `<div class="task-note">${escapeHtml(todo.note)}</div>` : "";
            const listItem = $(`
                <li class="todo-item${todo.completed ? ' completed' : ''}" 
                    data-id="${todo.id}" 
                    data-priority="${todo.priority || 'low'}"
                    draggable="true">
                    <input type="checkbox" aria-label="Mark task as completed"${todo.completed ? ' checked' : ''}>
                    <span class="todo-item-text">${escapeHtml(todo.text)}</span>
                    ${colorTagHtml}
                    ${dueDateHtml}
                    <div class="todo-item-actions">
                        <button class="edit-btn" aria-label="Edit task" tabindex="0">✏️</button>
                        <button class="delete-btn" aria-label="Delete task" tabindex="0">🗑️</button>
                        <button class="note-btn" aria-label="Add/Edit note" tabindex="0">📝</button>
                    </div>
                    ${noteHtml}
                </li>
            `);
            todoList.append(listItem);
        });
        updateClearCompletedButtonVisibility();
        attachDragAndDrop();
    }
    // --- Color from tag ---
    function colorFromTag(tag) {
        // Deterministic pastel color for tag
        const h = Math.abs(hashString(tag)) % 360;
        return `hsl(${h},80%,65%)`;
    }
    function hashString(str){let h=0;for(let i=0;i<str.length;i++){h=31*h+str.charCodeAt(i);}return h;}
    // --- Accessibility helpers ---
    function escapeHtml(str) {
        return $("<div>").text(str).html();
    }

    // --- Event Handlers ---
    function addTodo() {
        const todoText = newTodoItemInput.val().trim();
        const priority = prioritySelect.val();
        const dueDate = dueDateInput.val();
        const colorTag = colorTagInput.val().trim().slice(0,10);
        if (todoText === "") {
            newTodoItemInput.addClass("input-error");
            newTodoItemInput.focus();
            setTimeout(() => newTodoItemInput.removeClass("input-error"), 700);
            return;
        }
        const newTodo = {
            id: generateUniqueId(),
            text: todoText,
            completed: false,
            priority: priority,
            dueDate: dueDate,
            colorTag: colorTag,
            note: ""
        };
        todos.push(newTodo);
        saveTodos();
        newTodoItemInput.val("");
        dueDateInput.val("");
        colorTagInput.val("");
        prioritySelect.val("low");
        renderTodos(currentFilter, searchBox.val().trim());
        setTimeout(() => newTodoItemInput.focus(), 60);
    }
    todoList.on("change", ".todo-item input[type='checkbox']:first", function() {
        const listItem = $(this).closest(".todo-item");
        const todoId = listItem.data("id");
        const isCompleted = $(this).is(":checked");
        const todoIndex = todos.findIndex(todo => todo.id === todoId);
        if (todoIndex !== -1) {
            todos[todoIndex].completed = isCompleted;
            saveTodos();
            listItem.toggleClass("completed", isCompleted);
            renderTodos(currentFilter, searchBox.val().trim());
        }
    });
    todoList.on("click", ".edit-btn", function() {
        const listItem = $(this).closest(".todo-item");
        const todoId = listItem.data("id");
        const todoIndex = todos.findIndex(todo => todo.id === todoId);
        if (todoIndex === -1) return;
        const todo = todos[todoIndex];
        listItem.addClass("edit-mode");
        listItem.empty();
        // Edit fields
        const editInput = $(`<input type="text" class="edit-input" value="${escapeHtml(todo.text)}">`);
        const editDueInput = $(`<input type="date" class="edit-due-input" value="${todo.dueDate || ""}">`);
        const editPrioritySelect = $(`
            <select class="edit-priority-select">
                <option value="low"${todo.priority === "low" ? " selected" : ""}>Low</option>
                <option value="medium"${todo.priority === "medium" ? " selected" : ""}>Medium</option>
                <option value="high"${todo.priority === "high" ? " selected" : ""}>High</option>
            </select>
        `);
        const editColorTagInput = $(`<input type="text" class="edit-color-tag-input" value="${escapeHtml(todo.colorTag || "")}" maxlength="10" placeholder="Tag">`);
        const saveBtn = $(`<button class="edit-save-btn">Save</button>`);
        const cancelBtn = $(`<button class="edit-cancel-btn">Cancel</button>`);
        listItem.append(editInput, editDueInput, editPrioritySelect, editColorTagInput, saveBtn, cancelBtn);
        editInput.focus();
        saveBtn.on("click", function() {
            const newText = editInput.val().trim();
            const newDue = editDueInput.val();
            const newPriority = editPrioritySelect.val();
            const newColorTag = editColorTagInput.val().trim().slice(0,10);
            if (newText === "") {
                editInput.addClass("input-error");
                editInput.focus();
                setTimeout(() => editInput.removeClass("input-error"), 700);
                return;
            }
            todos[todoIndex].text = newText;
            todos[todoIndex].dueDate = newDue;
            todos[todoIndex].priority = newPriority;
            todos[todoIndex].colorTag = newColorTag;
            saveTodos();
            renderTodos(currentFilter, searchBox.val().trim());
        });
        cancelBtn.on("click", function() {
            renderTodos(currentFilter, searchBox.val().trim());
        });
        editInput.keypress(function(event) {
            if (event.key === "Enter") saveBtn.click();
        });
        editInput.keydown(function(event) {
            if (event.key === "Escape") cancelBtn.click();
        });
    });
    todoList.on("click", ".delete-btn", function() {
        const listItem = $(this).closest(".todo-item");
        const todoId = listItem.data("id");
        const todoIndex = todos.findIndex(todo => todo.id === todoId);
        if (todoIndex === -1) return;
        listItem.animate({ opacity: 0, marginLeft: "50px" }, 170, function() {
            todos.splice(todoIndex, 1);
            saveTodos();
            renderTodos(currentFilter, searchBox.val().trim());
        });
    });
    todoList.on("click", ".note-btn", function() {
        const listItem = $(this).closest(".todo-item");
        const todoId = listItem.data("id");
        const todoIndex = todos.findIndex(todo => todo.id === todoId);
        if (todoIndex === -1) return;
        const todo = todos[todoIndex];
        let note = prompt("Add/Edit note for this task:", todo.note || "");
        if (note !== null) {
            todos[todoIndex].note = note.trim();
            saveTodos();
            renderTodos(currentFilter, searchBox.val().trim());
        }
    });
    clearCompletedBtn.on("click", function() {
        if (!todos.some(todo => todo.completed)) return;
        if (confirm("Are you sure you want to clear all completed tasks?")) {
            todos = todos.filter(todo => !todo.completed);
            saveTodos();
            renderTodos(currentFilter, searchBox.val().trim());
        }
    });
    function updateClearCompletedButtonVisibility() {
        const hasCompletedTasks = todos.some(todo => todo.completed);
        clearCompletedBtn.toggle(hasCompletedTasks);
    }
    filterButtons.on("click", function() {
        filterButtons.removeClass("active").attr("aria-selected", "false");
        $(this).addClass("active").attr("aria-selected", "true");
        const filterType = $(this).attr("id").replace("show-", "");
        currentFilter = filterType;
        saveFilter(filterType);
        renderTodos(filterType, searchBox.val().trim());
    });
    addTaskBtn.on("click", addTodo);
    newTodoItemInput.keypress(function(event) {
        if (event.key === "Enter") addTodo();
    });
    // Live search
    searchBox.on("input", function() {
        renderTodos(currentFilter, searchBox.val().trim());
    });
    // --- Drag & Drop Sorting ---
    function attachDragAndDrop() {
        if (todoList.data('sortable-initialized')) return;
        new Sortable(todoList[0], {
            animation: 180,
            ghostClass: 'dragging',
            handle: '.todo-item-text, .due-date, .color-tag',
            onEnd: function(evt) {
                if (evt.oldIndex === evt.newIndex) return;
                const moved = todos.splice(evt.oldIndex, 1)[0];
                todos.splice(evt.newIndex, 0, moved);
                saveTodos();
                renderTodos(currentFilter, searchBox.val().trim());
            }
        });
        todoList.data('sortable-initialized', true);
    }
    // --- Dark mode ---
    function updateDarkModeUI() {
        if (darkMode) {
            $("body").addClass("dark");
            darkModeToggle.text("☀️");
        } else {
            $("body").removeClass("dark");
            darkModeToggle.text("🌙");
        }
    }
    darkModeToggle.on("click", function() {
        darkMode = !darkMode;
        localStorage.setItem("todo_dark_mode", darkMode ? "true" : "false");
        updateDarkModeUI();
    });
    updateDarkModeUI();
    // Initial load
    loadTodos();
    // Restore filter UI state
    filterButtons.removeClass("active").attr("aria-selected", "false");
    $(`#show-${currentFilter}`).addClass("active").attr("aria-selected", "true");
});