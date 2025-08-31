/**
 * Centralized service rotation utilities for Web Translator
 * Provides consistent service switching logic across all components
 * 
 * @author Web Translator Team
 * @version 1.0.0
 */

/**
 * Service rotation configuration following the standard pattern:
 * Google → Yandex → LLM → Google
 * 
 * This object defines the next service in the rotation cycle.
 * Adding new services should maintain the cyclic nature.
 */
const SERVICE_ROTATION = {
    "google": "yandex",
    "yandex": "llm", 
    "llm": "google"
};

/**
 * Available translation services in order of rotation
 */
const AVAILABLE_SERVICES = ["google", "yandex", "llm"];

/**
 * Default service when invalid service is encountered
 */
const DEFAULT_SERVICE = "google";

/**
 * Service rotation utilities namespace
 */
const serviceRotation = {
    /**
     * Get the next service in the rotation cycle
     * @param {string} currentService - Current active service
     * @returns {string} Next service in rotation cycle
     */
    getNextService(currentService) {
        return SERVICE_ROTATION[currentService] || DEFAULT_SERVICE;
    },

    /**
     * Get the previous service in the rotation cycle
     * @param {string} currentService - Current active service
     * @returns {string} Previous service in rotation cycle
     */
    getPreviousService(currentService) {
        const currentIndex = AVAILABLE_SERVICES.indexOf(currentService);
        if (currentIndex === -1) return DEFAULT_SERVICE;
        
        const prevIndex = (currentIndex - 1 + AVAILABLE_SERVICES.length) % AVAILABLE_SERVICES.length;
        return AVAILABLE_SERVICES[prevIndex];
    },

    /**
     * Check if a service is valid
     * @param {string} service - Service to validate
     * @returns {boolean} True if service is valid
     */
    isValidService(service) {
        return AVAILABLE_SERVICES.includes(service);
    },

    /**
     * Get all available services
     * @returns {string[]} Array of available services
     */
    getAvailableServices() {
        return [...AVAILABLE_SERVICES];
    },

    /**
     * Get service display name for UI
     * @param {string} service - Service identifier
     * @returns {string} Display name for the service
     */
    getServiceDisplayName(service) {
        const displayNames = {
            "google": "Google Translate",
            "yandex": "Yandex.Translate", 
            "llm": "LLM (AI)"
        };
        return displayNames[service] || service;
    },

    /**
     * Get service icon path
     * @param {string} service - Service identifier
     * @returns {string} Icon path for the service
     */
    getServiceIconPath(service) {
        const iconPaths = {
            "google": "/icons/google-translate-32.png",
            "yandex": "/icons/yandex-translate-32.png",
            "llm": "/icons/llm-translate-32.png"
        };
        return iconPaths[service] || iconPaths[DEFAULT_SERVICE];
    },

    /**
     * Constants for external access
     */
    constants: {
        SERVICE_ROTATION,
        AVAILABLE_SERVICES,
        DEFAULT_SERVICE
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = serviceRotation;
} else if (typeof window !== 'undefined') {
    window.serviceRotation = serviceRotation;
}