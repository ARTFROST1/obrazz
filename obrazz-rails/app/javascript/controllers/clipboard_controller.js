import { Controller } from '@hotwired/stimulus';

// Connects to data-controller="clipboard"
export default class extends Controller {
  static targets = ['source', 'button', 'feedback'];
  static values = {
    successMessage: { type: String, default: 'Copied!' },
    errorMessage: { type: String, default: 'Failed to copy' },
  };

  async copy() {
    const text = this.sourceTarget.value || this.sourceTarget.textContent;

    try {
      await navigator.clipboard.writeText(text);
      this.showFeedback(true);
    } catch (error) {
      // Fallback for older browsers
      this.fallbackCopy(text);
    }
  }

  fallbackCopy(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();

    try {
      document.execCommand('copy');
      this.showFeedback(true);
    } catch (error) {
      this.showFeedback(false);
    }

    document.body.removeChild(textArea);
  }

  showFeedback(success) {
    // Update button text or show tooltip
    if (this.hasButtonTarget) {
      const originalContent = this.buttonTarget.innerHTML;
      const message = success ? this.successMessageValue : this.errorMessageValue;

      this.buttonTarget.innerHTML = `
        <svg class="h-4 w-4 ${success ? 'text-green-500' : 'text-red-500'}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          ${
            success
              ? '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>'
              : '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>'
          }
        </svg>
        <span class="ml-1">${message}</span>
      `;

      setTimeout(() => {
        this.buttonTarget.innerHTML = originalContent;
      }, 2000);
    }

    // Show feedback target if exists
    if (this.hasFeedbackTarget) {
      this.feedbackTarget.textContent = success ? this.successMessageValue : this.errorMessageValue;
      this.feedbackTarget.classList.remove('hidden');
      this.feedbackTarget.classList.add(success ? 'text-green-500' : 'text-red-500');

      setTimeout(() => {
        this.feedbackTarget.classList.add('hidden');
      }, 2000);
    }
  }
}
