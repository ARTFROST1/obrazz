import { Controller } from '@hotwired/stimulus';

// Connects to data-controller="alert"
export default class extends Controller {
  static targets = ['container'];
  static values = {
    autoHide: { type: Boolean, default: true },
    hideDelay: { type: Number, default: 5000 },
  };

  connect() {
    if (this.autoHideValue) {
      this.scheduleHide();
    }
  }

  scheduleHide() {
    this.hideTimeout = setTimeout(() => {
      this.dismiss();
    }, this.hideDelayValue);
  }

  dismiss() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }

    // Add fade-out animation
    this.element.classList.add('opacity-0', 'transform', '-translate-y-2');
    this.element.classList.remove('opacity-100');

    // Remove element after animation
    setTimeout(() => {
      this.element.remove();
    }, 300);
  }

  // Pause auto-hide on hover
  pause() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
  }

  // Resume auto-hide on mouse leave
  resume() {
    if (this.autoHideValue) {
      this.scheduleHide();
    }
  }
}
