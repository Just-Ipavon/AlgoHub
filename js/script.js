/**
 * Gestisce la logica del menu mobile per la navbar.
 */
document.addEventListener('DOMContentLoaded', () => {
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const mobileMenu = document.getElementById('mobile-menu');

    if (mobileMenuButton && mobileMenu) {
        mobileMenuButton.addEventListener('click', () => {
            const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
            mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
            mobileMenu.classList.toggle('hidden');

            // Scambia le icone (menu/chiudi)
            const icons = mobileMenuButton.querySelectorAll('svg');
            icons[0].classList.toggle('hidden'); // Icona menu
            icons[0].classList.toggle('block');
            icons[1].classList.toggle('hidden'); // Icona chiudi
            icons[1].classList.toggle('block');
        });
    }
});
