

document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.querySelector('.navbar');
    const hamburger = document.querySelector('.hamburger');
    const mobileSidebar = document.querySelector('.mobile-sidebar');
    const sidebarOverlay = document.querySelector('.sidebar-overlay');
    const body = document.body;

    const handleScroll = () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    };
    window.addEventListener('scroll', handleScroll);
    handleScroll();

    const openSidebar = () => {
        mobileSidebar.classList.add('active');
        sidebarOverlay.classList.add('active');
        body.style.overflow = 'hidden';
    };

    const closeSidebar = () => {
        mobileSidebar.classList.remove('active');
        sidebarOverlay.classList.remove('active');
        body.style.overflow = '';
    };

    const toggleSidebar = () => {
        if (mobileSidebar.classList.contains('active')) {
            closeSidebar();
        } else {
            openSidebar();
        }
    };

    if (hamburger) {
        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeSidebar);
    }

    if (mobileSidebar) {
        mobileSidebar.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closeSidebar();
            });
        });
    }

    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                closeSidebar();

                const offset = 80;
                const top = target.getBoundingClientRect().top + window.scrollY - offset;
                window.scrollTo({ top, behavior: 'smooth' });
            }
        });
    });

    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-links a, .mobile-sidebar a').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href === currentPath) {
            link.classList.add('active');
        }
    });
});

function logout() {
    localStorage.removeItem('user');
    window.location.href = 'index.html';
}
