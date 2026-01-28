import { Controller } from '@hotwired/stimulus';

// Connects to data-controller="tabs"
export default class extends Controller {
  static targets = ['tab', 'panel'];
  static values = {
    activeTab: { type: String, default: '' },
  };

  connect() {
    // Set initial active tab
    if (!this.activeTabValue && this.tabTargets.length > 0) {
      this.activeTabValue = this.tabTargets[0].dataset.tabId;
    }
    this.updateTabs();
  }

  select(event) {
    const tabId = event.currentTarget.dataset.tabId;
    this.activeTabValue = tabId;
    this.updateTabs();
  }

  updateTabs() {
    // Update tab buttons
    this.tabTargets.forEach((tab) => {
      const isActive = tab.dataset.tabId === this.activeTabValue;

      if (isActive) {
        tab.classList.add('border-purple-500', 'text-purple-600');
        tab.classList.remove(
          'border-transparent',
          'text-gray-500',
          'hover:text-gray-700',
          'hover:border-gray-300',
        );
        tab.setAttribute('aria-selected', 'true');
      } else {
        tab.classList.remove('border-purple-500', 'text-purple-600');
        tab.classList.add(
          'border-transparent',
          'text-gray-500',
          'hover:text-gray-700',
          'hover:border-gray-300',
        );
        tab.setAttribute('aria-selected', 'false');
      }
    });

    // Update panels
    this.panelTargets.forEach((panel) => {
      const isActive = panel.dataset.tabId === this.activeTabValue;

      if (isActive) {
        panel.classList.remove('hidden');
      } else {
        panel.classList.add('hidden');
      }
    });
  }
}
