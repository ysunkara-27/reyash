document.addEventListener('DOMContentLoaded', () => {
    // === Scramble Text Effect ===
    const scrambleEl = document.getElementById('role-scrambler');
    const chars = '!@#$%^&*()_+{}:"<>?ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const duration = 2000000; // Run forever (or until user leaves)

    function scrambleText() {
        // Generate random string length 15-20
        const length = Math.floor(Math.random() * 5) + 15;
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        scrambleEl.textContent = result;
    }

    // Super super fast (every 30ms)
    setInterval(scrambleText, 30);


    // === Navigation System ===
    const body = document.body;
    const nameTitle = document.getElementById('main-name');
    const homeContent = document.getElementById('home-content');
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');

    // Function to Reset to Home State
    function goHome() {
        body.classList.remove('section-active');
        homeContent.classList.remove('hidden');

        // Hide all sections
        sections.forEach(sec => sec.classList.remove('active'));

        // Remove active state from nav
        navItems.forEach(item => item.classList.remove('active'));
    }

    // Function to Show a Section
    function showSection(targetId) {
        // 1. Set global active state (shrinks name)
        body.classList.add('section-active');

        // 2. Hide home content
        homeContent.classList.add('hidden');

        // 3. Update Nav
        navItems.forEach(item => {
            if (item.dataset.target === targetId) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });

        // 4. Show Specific Section
        sections.forEach(section => {
            if (section.id === targetId) {
                // Add active class after a tiny delay for transitions if needed, 
                // or immediately if CSS handles opacity transition
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
    }

    // Event Listeners for Nav Items
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const target = item.dataset.target;
            showSection(target);
        });
    });

    // Event Listener for Name Title (Return to Home)
    const profilePic = document.getElementById('profile-pic');

    function handleHomeClick() {
        if (body.classList.contains('section-active')) {
            goHome();
        }
    }

    nameTitle.addEventListener('click', handleHomeClick);
    if (profilePic) profilePic.addEventListener('click', handleHomeClick);

    // Handle Hash Change (for direct linking or back button)
    // Optional: add hash handling if desired, but sticking to click logic for smoother SPA feel
});
