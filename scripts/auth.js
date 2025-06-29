class TaskFlowAuth {
    constructor() {
        this.form = document.getElementById('registrationForm');
        this.nameInput = document.getElementById('name');
        this.dobInput = document.getElementById('dob');
        this.submitBtn = document.getElementById('submitBtn');
        this.errorMessage = document.getElementById('errorMessage');
        this.successMessage = document.getElementById('successMessage');
        
        this.init();
    }

    init() {
        this.checkExistingUser();
        this.form.addEventListener('submit', this.handleSubmit.bind(this));
        this.nameInput.addEventListener('input', this.validateForm.bind(this));
        this.dobInput.addEventListener('change', this.validateForm.bind(this));
    }

    checkExistingUser() {
        const userData = localStorage.getItem('taskflow_user');
        if (userData) {
            try {
                const user = JSON.parse(userData);
                if (user.name && user.dateOfBirth && this.isValidAge(user.dateOfBirth)) {
                    this.showSuccess('Welcome back! Redirecting to your tasks...');
                    setTimeout(() => {
                        window.location.href = 'app.html';
                    }, 1500);
                }
            } catch (error) {
                console.error('Error parsing user data:', error);
                localStorage.removeItem('taskflow_user');
            }
        }
    }

    calculateAge(dateOfBirth) {
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        return age;
    }

    isValidAge(dateOfBirth) {
        return this.calculateAge(dateOfBirth) > 10;
    }

    validateForm() {
        const name = this.nameInput.value.trim();
        const dob = this.dobInput.value;
        
        this.hideMessages();
        
        if (name && dob) {
            if (!this.isValidAge(dob)) {
                this.showError('You must be over 10 years old to use TaskFlow.');
                this.submitBtn.disabled = true;
                return false;
            }
            this.submitBtn.disabled = false;
            return true;
        } else {
            this.submitBtn.disabled = true;
            return false;
        }
    }

    handleSubmit(e) {
        e.preventDefault();
        
        const name = this.nameInput.value.trim();
        const dob = this.dobInput.value;
        
        if (!name || !dob) {
            this.showError('Please fill in all fields.');
            return;
        }
        
        if (!this.isValidAge(dob)) {
            this.showError('You must be over 10 years old to use TaskFlow.');
            return;
        }
        
        const userData = {
            name: name,
            dateOfBirth: dob,
            registrationDate: new Date().toISOString()
        };
        
        localStorage.setItem('taskflow_user', JSON.stringify(userData));
        
        this.showSuccess('Registration successful! Redirecting to your tasks...');
        
        setTimeout(() => {
            window.location.href = 'app.html';
        }, 1500);
    }

    showError(message) {
        this.errorMessage.textContent = message;
        this.errorMessage.style.display = 'block';
        this.successMessage.style.display = 'none';
    }

    showSuccess(message) {
        this.successMessage.textContent = message;
        this.successMessage.style.display = 'block';
        this.errorMessage.style.display = 'none';
    }

    hideMessages() {
        this.errorMessage.style.display = 'none';
        this.successMessage.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TaskFlowAuth();
});