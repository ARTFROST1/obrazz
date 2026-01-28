import { Controller } from '@hotwired/stimulus';

// Connects to data-controller="modal"
export default class extends Controller {
  static targets = ['container', 'backdrop', 'panel'];
  static values = {
    open: { type: Boolean, default: false },
  };

  connect() {
    this.keydownHandler = this.handleKeydown.bind(this);
    document.addEventListener('keydown', this.keydownHandler);
  }

  disconnect() {
    document.removeEventListener('keydown', this.keydownHandler);
    document.body.classList.remove('overflow-hidden');
  }

  open() {
    this.openValue = true;
    this.updateModal();
  }

  close() {
    this.openValue = false;
    this.updateModal();
  }

  toggle() {
    this.openValue = !this.openValue;
    this.updateModal();
  }

  updateModal() {
    if (this.openValue) {
      // Show modal
      this.containerTarget.classList.remove('hidden');
      document.body.classList.add('overflow-hidden');

      // Animate in
      requestAnimationFrame(() => {
        if (this.hasBackdropTarget) {
          this.backdropTarget.classList.remove('opacity-0');
          this.backdropTarget.classList.add('opacity-100');
        }
        if (this.hasPanelTarget) {
          this.panelTarget.classList.remove('opacity-0', 'scale-95');
          this.panelTarget.classList.add('opacity-100', 'scale-100');
        }
      });
    } else {
      // Animate out
      if (this.hasBackdropTarget) {
        this.backdropTarget.classList.remove('opacity-100');
        this.backdropTarget.classList.add('opacity-0');
      }
      if (this.hasPanelTarget) {
        this.panelTarget.classList.remove('opacity-100', 'scale-100');
        this.panelTarget.classList.add('opacity-0', 'scale-95');
      }

      // Hide after animation
      setTimeout(() => {
        if (!this.openValue) {
          this.containerTarget.classList.add('hidden');
          document.body.classList.remove('overflow-hidden');
        }
      }, 200);
    }
  }

  handleKeydown(event) {
    if (event.key === 'Escape' && this.openValue) {
      this.close();
    }
  }

  // Close when clicking backdrop
  backdropClick(event) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
