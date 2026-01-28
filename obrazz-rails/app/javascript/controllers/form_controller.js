import { Controller } from '@hotwired/stimulus';

// Connects to data-controller="form"
export default class extends Controller {
  static targets = ['submit', 'input'];
  static values = {
    dirty: { type: Boolean, default: false },
  };

  connect() {
    this.originalData = new FormData(this.element);
  }

  // Track form changes
  change() {
    this.dirtyValue = this.hasChanges();
    this.updateSubmitButton();
  }

  hasChanges() {
    const currentData = new FormData(this.element);

    for (const [key, value] of currentData.entries()) {
      if (this.originalData.get(key) !== value) {
        return true;
      }
    }

    return false;
  }

  updateSubmitButton() {
    if (this.hasSubmitTarget) {
      if (this.dirtyValue) {
        this.submitTarget.disabled = false;
        this.submitTarget.classList.remove('opacity-50', 'cursor-not-allowed');
      } else {
        this.submitTarget.disabled = true;
        this.submitTarget.classList.add('opacity-50', 'cursor-not-allowed');
      }
    }
  }

  // Confirm before leaving with unsaved changes
  beforeUnload(event) {
    if (this.dirtyValue) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  // Reset form to original state
  reset() {
    this.element.reset();
    this.dirtyValue = false;
    this.updateSubmitButton();
  }

  // Mark form as clean (after successful submission)
  markClean() {
    this.dirtyValue = false;
    this.originalData = new FormData(this.element);
  }
}
