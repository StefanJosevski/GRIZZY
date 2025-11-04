document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', () => {
        const path = card.getAttribute('data-path');

        if (path === "/gpa-calculator") {
            window.location.href = "grizzy.html";
        } else if (path === "/study-buddy") {
            window.location.href = "Study_Buddy.html";
        } else if (path === "/schedule-assister") {
            window.location.href = "scheduler.html";
        }
    });
});