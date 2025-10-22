// Course Registration JavaScript
let coursesData = [];
let selectedCourses = [];
const MAX_CREDITS = 18;

// Load courses from JSON file
async function loadCourses() {
    try {
        const response = await fetch('rit_courses__1_.json');
        const data = await response.json();
        coursesData = data.courses;
        displayCourses();
    } catch (error) {
        console.error('Error loading courses:', error);
        document.getElementById('coursesList').innerHTML = '<p style="color: #ff6600; text-align: center;">Error loading courses. Please make sure the JSON file is in the same directory.</p>';
    }
}

// Group courses by department
function groupByDepartment(courses) {
    const grouped = {};
    courses.forEach(course => {
        if (!grouped[course.department]) {
            grouped[course.department] = [];
        }
        grouped[course.department].push(course);
    });
    return grouped;
}

// Calculate total credits
function getTotalCredits() {
    return selectedCourses.reduce((sum, course) => sum + course.credits, 0);
}

// Update credit display
function updateCreditDisplay() {
    const total = getTotalCredits();
    const creditElements = document.querySelectorAll('#creditCount, #calendarCredits');
    creditElements.forEach(el => {
        el.textContent = total;
        if (total >= MAX_CREDITS) {
            el.classList.add('limit-reached');
        } else {
            el.classList.remove('limit-reached');
        }
    });
}

// Check if a course can be selected
function canSelectCourse(course) {
    const currentTotal = getTotalCredits();
    return currentTotal + course.credits <= MAX_CREDITS;
}

// Toggle course selection
function toggleCourse(courseId) {
    const course = coursesData.find(c => c.id === courseId);
    if (!course) return;

    const index = selectedCourses.findIndex(c => c.id === courseId);
    
    if (index > -1) {
        // Deselect course
        selectedCourses.splice(index, 1);
    } else {
        // Select course if within credit limit
        if (canSelectCourse(course)) {
            selectedCourses.push(course);
        } else {
            alert('Cannot add this course. You would exceed the 18 credit limit! 🐯');
            return;
        }
    }
    
    updateCreditDisplay();
    updateCourseCards();
    updateCalendarView();
}

// Update course card styling
function updateCourseCards() {
    coursesData.forEach(course => {
        const card = document.querySelector(`[data-course-id="${course.id}"]`);
        const checkbox = document.getElementById(`course-${course.id}`);
        
        if (!card || !checkbox) return;
        
        const isSelected = selectedCourses.some(c => c.id === course.id);
        
        if (isSelected) {
            card.classList.add('selected');
            checkbox.checked = true;
        } else {
            card.classList.remove('selected');
            checkbox.checked = false;
            
            // Disable if would exceed credit limit
            const canSelect = canSelectCourse(course);
            card.classList.toggle('disabled', !canSelect);
            checkbox.disabled = !canSelect;
        }
    });
}

// Display courses organized by department
function displayCourses() {
    const coursesContainer = document.getElementById('coursesList');
    const grouped = groupByDepartment(coursesData);
    
    let html = '';
    
    // Sort departments alphabetically
    const departments = Object.keys(grouped).sort();
    
    departments.forEach(department => {
        const courses = grouped[department].sort((a, b) => a.courseCode.localeCompare(b.courseCode));
        
        html += `
            <div class="department-section">
                <div class="department-header">
                    <h2>🐯 ${department}</h2>
                </div>
                <div class="courses-grid">
        `;
        
        courses.forEach(course => {
            const prereqText = course.prerequisites.length > 0 
                ? `Prerequisites: ${course.prerequisites.join(', ')}` 
                : 'No prerequisites';
            
            const termsText = `Available: ${course.terms.join(', ')}`;
            
            html += `
                <div class="course-card" data-course-id="${course.id}">
                    <input type="checkbox" 
                           class="course-checkbox" 
                           id="course-${course.id}"
                           onchange="toggleCourse('${course.id}')">
                    <div class="course-info">
                        <div class="course-title">
                            <span class="course-code">${course.courseCode}</span>
                            <span class="course-name" onclick="showCourseDetails('${course.id}')">${course.title}</span>
                            <span class="course-credits">${course.credits} credits</span>
                        </div>
                        <div class="course-meta">
                            ${prereqText} | ${termsText}
                        </div>
                    </div>
                </div>
            `;
        });
        
        html += `
                </div>
            </div>
        `;
    });
    
    coursesContainer.innerHTML = html;
    updateCourseCards();
}

// Show course description in modal
function showCourseDetails(courseId) {
    const course = coursesData.find(c => c.id === courseId);
    if (!course) return;
    
    const modal = document.getElementById('courseModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    
    modalTitle.textContent = `${course.courseCode}: ${course.title}`;
    
    const prereqText = course.prerequisites.length > 0 
        ? course.prerequisites.join(', ') 
        : 'None';
    
    modalBody.innerHTML = `
        <p><strong>🐯 Department:</strong> ${course.department}</p>
        <p><strong>📚 Credits:</strong> ${course.credits}</p>
        <p><strong>📋 Prerequisites:</strong> ${prereqText}</p>
        <p><strong>📅 Available Terms:</strong> ${course.terms.join(', ')}</p>
        <p><strong>📖 Description:</strong></p>
        <p>${course.description}</p>
    `;
    
    modal.style.display = 'block';
}

// Close modal
function closeModal() {
    document.getElementById('courseModal').style.display = 'none';
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('courseModal');
    if (event.target == modal) {
        modal.style.display = 'none';
    }
}

// Show different views
function showView(viewName) {
    document.querySelectorAll('.view-container').forEach(container => {
        container.classList.remove('active');
    });
    
    if (viewName === 'course-list') {
        document.getElementById('course-list-view').classList.add('active');
    } else if (viewName === 'calendar') {
        document.getElementById('calendar-view').classList.add('active');
        updateCalendarView();
    }
}

// Update calendar view
function updateCalendarView() {
    updateSelectedCoursesList();
    generateCalendar();
}

// Update selected courses list
function updateSelectedCoursesList() {
    const container = document.getElementById('selectedCoursesContent');
    
    if (selectedCourses.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="tiger-emoji">🐯</div>
                <p>No courses selected yet. Go back and select some courses!</p>
            </div>
        `;
        return;
    }
    
    let html = '';
    selectedCourses.sort((a, b) => a.courseCode.localeCompare(b.courseCode)).forEach(course => {
        html += `
            <div class="selected-course-item">
                <div>
                    <strong>${course.courseCode}</strong>: ${course.title}
                </div>
                <div>
                    <span class="course-credits">${course.credits} credits</span>
                </div>
            </div>
        `;
    });
    
    container.innerHTML = html;
}

// Generate calendar grid
function generateCalendar() {
    const grid = document.getElementById('calendarGrid');
    
    // Define time slots (8 AM to 8 PM)
    const timeSlots = [
        '8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
        '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM',
        '6:00 PM', '7:00 PM'
    ];
    
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    
    let html = '';
    
    // Header row
    html += '<div class="calendar-header-cell">Time</div>';
    days.forEach(day => {
        html += `<div class="calendar-header-cell">${day}</div>`;
    });
    
    // Time slot rows
    timeSlots.forEach(time => {
        html += `<div class="time-cell">${time}</div>`;
        
        days.forEach(day => {
            const courses = getCoursesForTimeSlot(day, time);
            let cellContent = '';
            
            if (courses.length > 0) {
                courses.forEach(course => {
                    cellContent += `
                        <div class="course-block">
                            <div class="course-block-title">${course.courseCode}</div>
                            <div>${course.title}</div>
                        </div>
                    `;
                });
            }
            
            html += `<div class="calendar-cell">${cellContent}</div>`;
        });
    });
    
    grid.innerHTML = html;
}

// Get courses for a specific time slot (mock data for demonstration)
// In a real system, courses would have actual meeting times
function getCoursesForTimeSlot(day, time) {
    if (selectedCourses.length === 0) return [];
    
    // Mock schedule generation - assign courses to random time slots
    // In production, this would use actual course meeting times
    const mockSchedule = generateMockSchedule();
    const key = `${day}-${time}`;
    return mockSchedule[key] || [];
}

// Generate a mock schedule for demonstration
function generateMockSchedule() {
    const schedule = {};
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const morningTimes = ['9:00 AM', '10:00 AM', '11:00 AM'];
    const afternoonTimes = ['1:00 PM', '2:00 PM', '3:00 PM'];
    
    // Distribute selected courses across the week
    selectedCourses.forEach((course, index) => {
        // Courses typically meet 2-3 times per week
        const meetingDays = [];
        
        if (index % 2 === 0) {
            meetingDays.push('Monday', 'Wednesday', 'Friday');
        } else {
            meetingDays.push('Tuesday', 'Thursday');
        }
        
        // Alternate between morning and afternoon
        const times = index % 2 === 0 ? morningTimes : afternoonTimes;
        const selectedTime = times[index % times.length];
        
        meetingDays.forEach(day => {
            const key = `${day}-${selectedTime}`;
            if (!schedule[key]) {
                schedule[key] = [];
            }
            schedule[key].push(course);
        });
    });
    
    return schedule;
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    loadCourses();
    updateCreditDisplay();
});

// Keyboard shortcut - ESC to close modal
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeModal();
    }
});