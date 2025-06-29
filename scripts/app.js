class TaskFlowApp {
    constructor() {
        this.user = null;
        this.tasks = {
            todo: [],
            completed: [],
            archived: []
        };
        this.currentTab = 'todo';
        
        this.init();
    }

    async init() {
        this.checkAuthentication();
        this.setupEventListeners();
        await this.loadInitialData();
        this.renderTasks();
        this.updateCounts();
    }

    checkAuthentication() {
        const userData = localStorage.getItem('taskflow_user');
        if (!userData) {
            window.location.href = 'index.html';
            return;
        }

        try {
            this.user = JSON.parse(userData);
            this.setupUserProfile();
        } catch (error) {
            console.error('Error parsing user data:', error);
            localStorage.removeItem('taskflow_user');
            window.location.href = 'index.html';
        }
    }

    setupUserProfile() {
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        
        userName.textContent = this.user.name;
        
        const initials = this.user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        userAvatar.textContent = initials;
    }

    setupEventListeners() {
        const signOutBtn = document.getElementById('signOutBtn');
        const addTaskBtn = document.getElementById('addTaskBtn');
        const taskInput = document.getElementById('taskInput');
        const tabs = document.querySelectorAll('.tab');

        signOutBtn.addEventListener('click', this.signOut.bind(this));
        addTaskBtn.addEventListener('click', this.addTask.bind(this));
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.addTask();
            }
        });

        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchTab(tab.dataset.tab);
            });
        });
    }

    switchTab(tabName) {
        // Update active tab
        document.querySelectorAll('.tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update active content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}Content`).classList.add('active');

        this.currentTab = tabName;
    }

    async loadInitialData() {
        const existingTasks = localStorage.getItem('taskflow_tasks');
        
        if (existingTasks) {
            try {
                this.tasks = JSON.parse(existingTasks);
            } catch (error) {
                console.error('Error parsing tasks data:', error);
                await this.loadDummyData();
            }
        } else {
            await this.loadDummyData();
        }
    }

    async loadDummyData() {
        try {
            const response = await fetch('https://dummyjson.com/todos');
            const data = await response.json();
            
            this.tasks.todo = data.todos.slice(0, 5).map((todo, index) => ({
                id: Date.now() + index,
                text: todo.todo,
                timestamp: this.formatTimestamp(new Date()),
                createdAt: new Date().toISOString()
            }));
            
            this.saveTasks();
        } catch (error) {
            console.error('Error loading dummy data:', error);
            this.tasks.todo = [
                {
                    id: Date.now(),
                    text: "Welcome to TaskFlow! This is your first task.",
                    timestamp: this.formatTimestamp(new Date()),
                    createdAt: new Date().toISOString()
                }
            ];
            this.saveTasks();
        }
    }

    addTask() {
        const taskInput = document.getElementById('taskInput');
        const taskText = taskInput.value.trim();
        
        if (!taskText) {
            alert('Please enter a task description.');
            return;
        }
        
        const newTask = {
            id: Date.now(),
            text: taskText,
            timestamp: this.formatTimestamp(new Date()),
            createdAt: new Date().toISOString()
        };
        
        this.tasks.todo.push(newTask);
        taskInput.value = '';
        
        this.saveTasks();
        this.renderTasks();
        this.updateCounts();
    }

    moveTask(taskId, fromStage, toStage) {
        const taskIndex = this.tasks[fromStage].findIndex(task => task.id === taskId);
        if (taskIndex === -1) return;
        
        const task = this.tasks[fromStage].splice(taskIndex, 1)[0];
        task.timestamp = this.formatTimestamp(new Date());
        
        this.tasks[toStage].push(task);
        
        this.saveTasks();
        this.renderTasks();
        this.updateCounts();
    }

    renderTasks() {
        this.renderStage('todo');
        this.renderStage('completed');
        this.renderStage('archived');
    }

    renderStage(stage) {
        const container = document.getElementById(`${stage}Tasks`);
        const tasks = this.tasks[stage];
        
        if (tasks.length === 0) {
            container.innerHTML = this.getEmptyState(stage);
            return;
        }
        
        container.innerHTML = tasks.map(task => this.createTaskCard(task, stage)).join('');
    }

    createTaskCard(task, stage) {
        const actions = this.getTaskActions(task.id, stage);
        
        return `
            <div class="task-card">
                <div class="task-content">
                    <div class="task-text">${this.escapeHtml(task.text)}</div>
                    <div class="task-timestamp">
                        <span>Last modified at:</span>
                        <div>${task.timestamp}</div>
                    </div>
                </div>
                <div class="task-actions">
                    ${actions}
                </div>
            </div>
        `;
    }

    getTaskActions(taskId, stage) {
        switch (stage) {
            case 'todo':
                return `
                    <button class="action-btn complete-btn" onclick="app.moveTask(${taskId}, 'todo', 'completed')">
                        Mark as Completed
                    </button>
                    <button class="action-btn archive-btn" onclick="app.moveTask(${taskId}, 'todo', 'archived')">
                        <i class="fas fa-box-archive"></i> Archive
                    </button>
                `;
            case 'completed':
                return `
                    <button class="action-btn todo-btn" onclick="app.moveTask(${taskId}, 'completed', 'todo')">
                        Move to Todo
                    </button>
                    <button class="action-btn archive-btn" onclick="app.moveTask(${taskId}, 'completed', 'archived')">
                        <i class="fas fa-box-archive"></i> Archive
                    </button>
                `;
            case 'archived':
                return `
                    <button class="action-btn todo-btn" onclick="app.moveTask(${taskId}, 'archived', 'todo')">
                        Move to Todo
                    </button>
                    <button class="action-btn complete-btn" onclick="app.moveTask(${taskId}, 'archived', 'completed')">
                        Move to Completed
                    </button>
                `;
            default:
                return '';
        }
    }

    getEmptyState(stage) {
        const emptyStates = {
            todo: { icon: '📋', text: 'No tasks yet. Add your first task above!' },
            completed: { icon: '🎉', text: 'No completed tasks yet. You\'ve got this!' },
            archived: { icon: '📦', text: 'No archived tasks yet.' }
        };
        
        const state = emptyStates[stage];
        return `
            <div class="empty-state">
                <div class="empty-state-icon">${state.icon}</div>
                <p>${state.text}</p>
            </div>
        `;
    }

    updateCounts() {
        document.getElementById('todoCount').textContent = this.tasks.todo.length;
        document.getElementById('completedCount').textContent = this.tasks.completed.length;
        document.getElementById('archivedCount').textContent = this.tasks.archived.length;
    }

    formatTimestamp(date) {
        return date.toLocaleString('en-US', {
            month: '2-digit',
            day: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    saveTasks() {
        localStorage.setItem('taskflow_tasks', JSON.stringify(this.tasks));
    }

    signOut() {
        if (confirm('Are you sure you want to sign out?')) {
            localStorage.removeItem('taskflow_user');
            localStorage.removeItem('taskflow_tasks');
            window.location.href = 'index.html';
        }
    }
}

// Initialize the application
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TaskFlowApp();
});