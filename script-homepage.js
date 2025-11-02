document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', () => {
        const path = card.getAttribute('data-path');

        if (path === "/gpa-calculator") {
            window.location.href = "grizzy.html";
        } else {
            alert(`"${path}" feature coming soon!`);
        }
    });
});