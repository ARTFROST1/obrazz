import { Controller } from '@hotwired/stimulus';

// Connects to data-controller="mobile-menu"
export default class extends Controller {
  static targets = ['sidebar', 'overlay', 'openButton', 'closeButton'];
  static values = {
    open: { type: Boolean, default: false },
  };

  connect() {
    // Close on escape key
    this.keydownHandler = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.keydownHandler);
  }

  disconnect() {
    document.removeEventListener('keydown', this.keydownHandler);
    // Restore body scroll
    document.body.classList.remove('overflow-hidden');
  }

  toggle() {
    this.openValue = !this.openValue;
    this.updateMenu();
  }

  open() {
    this.openValue = true;
    this.updateMenu();
  }

  close() {
    this.openValue = false;
    this.updateMenu();
  }

  updateMenu() {
    if (this.openValue) {
      // Show overlay and sidebar
      if (this.hasOverlayTarget) {
        this.overlayTarget.classList.remove('hidden');
        // Trigger animation
        requestAnimationFrame(() => {
          this.overlayTarget.classList.remove('opacity-0');
          this.overlayTarget.classList.add('opacity-100');
        });
      }

      if (this.hasSidebarTarget) {
        this.sidebarTarget.classList.remove('-translate-x-full');
        this.sidebarTarget.classList.add('translate-x-0');
      }

      // Prevent body scroll
      document.body.classList.add('overflow-hidden');
    } else {
      // Hide overlay and sidebar
      if (this.hasOverlayTarget) {
        this.overlayTarget.classList.remove('opacity-100');
        this.overlayTarget.classList.add('opacity-0');
        setTimeout(() => {
          if (!this.openValue) {
            this.overlayTarget.classList.add('hidden');
          }
        }, 300);
      }

      if (this.hasSidebarTarget) {
        this.sidebarTarget.classList.remove('translate-x-0');
        this.sidebarTarget.classList.add('-translate-x-full');
      }

      // Restore body scroll
      document.body.classList.remove('overflow-hidden');
    }
  }

  handleKeydown(event) {
    if (event.key === 'Escape' && this.openValue) {
      this.close();
    }
  }

  // Close when clicking on a nav link (for SPA-like behavior)
  navigateTo(event) {
    this.close();
  }
}
