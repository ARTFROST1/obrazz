import { Controller } from '@hotwired/stimulus';

// Connects to data-controller="dropdown"
export default class extends Controller {
  static targets = ['menu', 'button'];
  static values = {
    open: { type: Boolean, default: false },
  };

  connect() {
    // Close dropdown when clicking outside
    this.clickOutsideHandler = this.clickOutside.bind(this);
    document.addEventListener('click', this.clickOutsideHandler);

    // Close on escape key
    this.keydownHandler = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.keydownHandler);
  }

  disconnect() {
    document.removeEventListener('click', this.clickOutsideHandler);
    document.removeEventListener('keydown', this.keydownHandler);
  }

  toggle(event) {
    event.stopPropagation();
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
    if (this.hasMenuTarget) {
      if (this.openValue) {
        this.menuTarget.classList.remove('hidden', 'opacity-0', 'scale-95');
        this.menuTarget.classList.add('opacity-100', 'scale-100');
      } else {
        this.menuTarget.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
          if (!this.openValue) {
            this.menuTarget.classList.add('hidden');
          }
        }, 100);
      }
    }
  }

  clickOutside(event) {
    if (this.openValue && !this.element.contains(event.target)) {
      this.close();
    }
  }

  handleKeydown(event) {
    if (event.key === 'Escape' && this.openValue) {
      this.close();
    }
  }
}
