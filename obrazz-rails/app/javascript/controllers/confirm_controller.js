import { Controller } from '@hotwired/stimulus';

// Connects to data-controller="confirm"
export default class extends Controller {
  static values = {
    message: { type: String, default: 'Are you sure?' },
    confirmText: { type: String, default: '' },
  };

  confirm(event) {
    // If confirmText is set, require typing it
    if (this.confirmTextValue) {
      event.preventDefault();
      this.showConfirmDialog();
    } else {
      // Simple confirm dialog
      if (!window.confirm(this.messageValue)) {
        event.preventDefault();
      }
    }
  }

  showConfirmDialog() {
    // Create modal for dangerous actions
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 z-50 overflow-y-auto';
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('role', 'dialog');

    modal.innerHTML = `
      <div class="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" data-action="click->confirm#closeModal"></div>
        
        <span class="hidden sm:inline-block sm:h-screen sm:align-middle">&#8203;</span>
        
        <div class="relative inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 align-middle">
          <div class="sm:flex sm:items-start">
            <div class="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg class="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 class="text-lg font-medium leading-6 text-gray-900">${this.messageValue}</h3>
              <div class="mt-2">
                <p class="text-sm text-gray-500">
                  Please type <strong class="font-mono bg-gray-100 px-1 rounded">${this.confirmTextValue}</strong> to confirm.
                </p>
                <input type="text" 
                       id="confirm-input" 
                       class="mt-3 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                       placeholder="Type to confirm...">
              </div>
            </div>
          </div>
          <div class="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
            <button type="button" 
                    id="confirm-submit"
                    disabled
                    class="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              Confirm
            </button>
            <button type="button" 
                    id="confirm-cancel"
                    class="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const input = modal.querySelector('#confirm-input');
    const submitBtn = modal.querySelector('#confirm-submit');
    const cancelBtn = modal.querySelector('#confirm-cancel');

    // Enable submit only when text matches
    input.addEventListener('input', (e) => {
      submitBtn.disabled = e.target.value !== this.confirmTextValue;
    });

    // Handle confirm
    submitBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
      // Submit the form
      if (this.element.tagName === 'FORM') {
        this.element.submit();
      } else if (this.element.form) {
        this.element.form.submit();
      }
    });

    // Handle cancel
    cancelBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Focus input
    input.focus();
  }

  closeModal(event) {
    if (event.target === event.currentTarget) {
      event.target.closest('.fixed').remove();
    }
  }
}
