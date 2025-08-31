"use strict";

var $ = document.querySelector.bind(document)

twpConfig.onReady(function () {
    if (platformInfo.isMobile.any) {
        let style = document.createElement("style")
        style.textContent = ".desktopOnly {display: none !important}"
        document.head.appendChild(style)
    }

    let sideBarIsVisible = false
    $("#btnOpenMenu").onclick = e => {
        $("#menuContainer").classList.toggle("change")

        if (sideBarIsVisible) {
            $("#sideBar").style.display = "none"
            sideBarIsVisible = false
        } else {
            $("#sideBar").style.display = "block"
            sideBarIsVisible = true
        }
    }

    function hashchange() {
        const hash = location.hash || "#main"
        const divs = [$("#main"),  $("#translations"),  $("#hotkeys"), $("#storage"), $("#others")]
        divs.forEach(element => {
            element.style.display = "none"
        })

        document.querySelectorAll("nav a").forEach(a => {
            a.classList.remove("w3-light-grey")
        })

        $(hash).style.display = "block"
        $('a[href="' + hash + '"]').classList.add("w3-light-grey")

        const text = chrome.i18n.getMessage("lblSettings")
        $("#itemSelectedName").textContent = text

        if (sideBarIsVisible) {
            $("#menuContainer").classList.toggle("change")
            $("#sideBar").style.display = "none"
            sideBarIsVisible = false
        }
    }
    hashchange()
    window.addEventListener("hashchange", hashchange)

    function fillLanguageList(select) {
        let langs = twpLang.getLanguageList()

        const langsSorted = []

        for (const i in langs) {
            langsSorted.push([i, langs[i]])
        }

        langsSorted.sort(function (a, b) {
            // en should be the first
            if (a[0] === "en") return -1
            if (b[0] === "en") return 1
            // zh-CN and zh-TW should be the second and third
            if (a[0] === "zh-CN") return -1
            if (b[0] === "zh-CN") return 1
            if (a[0] === "zh-TW") return -1
            if (b[0] === "zh-TW") return 1
            return a[1].localeCompare(b[1]);
        })

        langsSorted.forEach(value => {
            const option = document.createElement("option")
            option.value = value[0]
            option.textContent = value[1]
            select.appendChild(option)
        })
    }

    fillLanguageList($("#targetLanguage1"))

    fillLanguageList($("#addToNeverTranslateLangs"))
    fillLanguageList($("#addToAlwaysTranslateLangs"))

  $("#darkMode").onchange = (e) => {
    twpConfig.set("darkMode", e.target.value);
    updateDarkMode();
  };
  $("#darkMode").value = twpConfig.get("darkMode");
    function enableDarkMode() {
        if (!$("#darkModeElement")) {
            const el = document.createElement("style")
            el.setAttribute("id", "darkModeElement")
            el.setAttribute("rel", "stylesheet")
            el.textContent = `
            * {
                scrollbar-color: #202324 #454a4d;
            }

            #donation * {
                background-color: #87CEEB !important;
            }

            #donation select {
                color: black !important;
                background-color: rgb(231, 230, 228) !important;
            }

            html *, nav, #header {
                color: rgb(231, 230, 228) !important;
                background-color: #181a1b !important;
            }
            `
            document.head.appendChild(el)
        }
    }

    function disableDarkMode() {
        if ($("#darkModeElement")) {
            $("#darkModeElement").remove()
        }
    }

    function updateDarkMode() {
        switch (twpConfig.get("darkMode")) {
            case "auto":
                if (matchMedia("(prefers-color-scheme: dark)").matches) {
                    enableDarkMode()
                } else {
                    disableDarkMode()
                }
                break
            case "yes":
                enableDarkMode()
                break
            case "no":
                disableDarkMode()
                break
            default:
                break
        }
    }
    updateDarkMode()


    // target languages

    const targetLanguages = twpConfig.get("targetLanguages")

    $("#targetLanguage1").value = targetLanguages[0]

    $("#targetLanguage1").onchange = e => {
        targetLanguages[0] = e.target.value
        twpConfig.set("targetLanguages", targetLanguages)
        if (targetLanguages.indexOf(twpConfig.get("targetLanguage")) == -1) {
            twpConfig.set("targetLanguage", targetLanguages[0])
        }
        if (targetLanguages.indexOf(twpConfig.get("targetLanguageTextTranslation")) == -1) {
            twpConfig.set("targetLanguageTextTranslation", targetLanguages[0])
        }
    }


    // Never translate these languages

    function createNodeToNeverTranslateLangsList(langCode, langName) {
        const li = document.createElement("li")
        li.setAttribute("class", "w3-display-container")
        li.value = langCode
        li.textContent = langName

        const close = document.createElement("span")
        close.setAttribute("class", "w3-button w3-transparent w3-display-right")
        close.innerHTML = "&times;"

        close.onclick = e => {
            e.preventDefault()

            twpConfig.removeLangFromNeverTranslate(langCode)
            li.remove()
        }

        li.appendChild(close)

        return li
    }

    const neverTranslateLangs = twpConfig.get("neverTranslateLangs")
    neverTranslateLangs.forEach(langCode => {
        const langName = twpLang.codeToLanguage(langCode)
        const li = createNodeToNeverTranslateLangsList(langCode, langName)
        $("#neverTranslateLangs").appendChild(li)
    })

    $("#addToNeverTranslateLangs").onchange = e => {
        const langCode = e.target.value
        const langName = twpLang.codeToLanguage(langCode)
        const li = createNodeToNeverTranslateLangsList(langCode, langName)
        $("#neverTranslateLangs").appendChild(li)

        twpConfig.addLangToNeverTranslate(langCode)
    }

    // Always translate these languages

    function createNodeToAlwaysTranslateLangsList(langCode, langName) {
        const li = document.createElement("li")
        li.setAttribute("class", "w3-display-container")
        li.value = langCode
        li.textContent = langName

        const close = document.createElement("span")
        close.setAttribute("class", "w3-button w3-transparent w3-display-right")
        close.innerHTML = "&times;"

        close.onclick = e => {
            e.preventDefault()

            twpConfig.removeLangFromAlwaysTranslate(langCode)
            li.remove()
        }

        li.appendChild(close)

        return li
    }

    const alwaysTranslateLangs = twpConfig.get("alwaysTranslateLangs")
    alwaysTranslateLangs.forEach(langCode => {
        const langName = twpLang.codeToLanguage(langCode)
        const li = createNodeToAlwaysTranslateLangsList(langCode, langName)
        $("#alwaysTranslateLangs").appendChild(li)
    })

    $("#addToAlwaysTranslateLangs").onchange = e => {
        const langCode = e.target.value
        const langName = twpLang.codeToLanguage(langCode)
        const li = createNodeToAlwaysTranslateLangsList(langCode, langName)
        $("#alwaysTranslateLangs").appendChild(li)

        twpConfig.addLangToAlwaysTranslate(langCode)
    }


    // Always translate these Sites

    function createNodeToAlwaysTranslateSitesList(hostname) {
        const li = document.createElement("li")
        li.setAttribute("class", "w3-display-container")
        li.value = hostname
        li.textContent = hostname

        const close = document.createElement("span")
        close.setAttribute("class", "w3-button w3-transparent w3-display-right")
        close.innerHTML = "&times;"

        close.onclick = e => {
            e.preventDefault()

            twpConfig.removeSiteFromAlwaysTranslate(hostname)
            li.remove()
        }

        li.appendChild(close)

        return li
    }

    const alwaysTranslateSites = twpConfig.get("alwaysTranslateSites")
    alwaysTranslateSites.forEach(hostname => {
        const li = createNodeToAlwaysTranslateSitesList(hostname)
        $("#alwaysTranslateSites").appendChild(li)
    })

    $("#addToAlwaysTranslateSites").onclick = e => {
        const hostname = prompt("Enter the site hostname", "www.site.com")
        if (!hostname) return;

        const li = createNodeToAlwaysTranslateSitesList(hostname)
        $("#alwaysTranslateSites").appendChild(li)

        twpConfig.addSiteToAlwaysTranslate(hostname)
    }

    // Never translate these Sites

    function createNodeToNeverTranslateSitesList(hostname) {
        const li = document.createElement("li")
        li.setAttribute("class", "w3-display-container")
        li.value = hostname
        li.textContent = hostname

        const close = document.createElement("span")
        close.setAttribute("class", "w3-button w3-transparent w3-display-right")
        close.innerHTML = "&times;"

        close.onclick = e => {
            e.preventDefault()

            twpConfig.removeSiteFromNeverTranslate(hostname)
            li.remove()
        }

        li.appendChild(close)

        return li
    }

    const neverTranslateSites = twpConfig.get("neverTranslateSites")
    neverTranslateSites.forEach(hostname => {
        const li = createNodeToNeverTranslateSitesList(hostname)
        $("#neverTranslateSites").appendChild(li)
    })

    $("#addToNeverTranslateSites").onclick = e => {
        const hostname = prompt("Enter the site hostname", "www.site.com")
        if (!hostname) return;

        const li = createNodeToNeverTranslateSitesList(hostname)
        $("#neverTranslateSites").appendChild(li)

        twpConfig.addSiteToNeverTranslate(hostname)
    }

    function createNodeToSpecialRulesList(hostname) {
        const li = document.createElement("li")
        li.setAttribute("class", "w3-display-container")
        li.value = hostname
        li.textContent = hostname

        const close = document.createElement("span")
        close.setAttribute("class", "w3-button w3-transparent w3-display-right")
        close.innerHTML = "&times;"

        close.onclick = e => {
            e.preventDefault()

            twpConfig.removeRuleFromSpecialRules(hostname)
            li.remove()
        }

        li.appendChild(close)

        return li
    }
    const specialRules = twpConfig.get("specialRules")
    specialRules.forEach(hostname => {
        const li = createNodeToSpecialRulesList(hostname)
        $("#specialRules").appendChild(li)
    })

    $("#addToSpecialRules").onclick = e => {

        const rule = document.querySelector("#specialRule").value
        if (!rule) return;

        // check rule is valid
        // it must an valid json object 
        
        try{
          const ruleObj = JSON.parse(rule)
        }catch(e){
          alert("Invalid rule, it should be an json object string")
          return
        }
        const li = createNodeToSpecialRulesList(rule)
        $("#specialRules").appendChild(li)
        // clean textarea
        document.querySelector("#specialRule").value = ""

        twpConfig.addRuleToSpecialRules(rule)
    }
    function createcustomDictionary(keyWord,customValue) {
        const li = document.createElement("li")
        li.setAttribute("class", "w3-display-container")
        li.value = keyWord
        if(customValue !== ''){
            li.textContent = keyWord + " ------------------- " + customValue
        }
        else{
            li.textContent = keyWord
        }
        const close = document.createElement("span")
        close.setAttribute("class", "w3-button w3-transparent w3-display-right")
        close.innerHTML = "&times;"

        close.onclick = e => {
            e.preventDefault()
            twpConfig.removeKeyWordFromcustomDictionary(keyWord)
            li.remove()
        }
        li.appendChild(close)
        return li
    }

    let customDictionary = twpConfig.get("customDictionary")
    customDictionary = new Map([...customDictionary.entries()].sort((a, b) => String(b[0]).length - String(a[0]).length))
    customDictionary.forEach(function(customValue,keyWord){
        const li = createcustomDictionary(keyWord,customValue)
        $("#customDictionary").appendChild(li)
    });

    $("#addToCustomDictionary").onclick = e => {
        let keyWord = prompt("Enter the keyWord, Minimum two letters ", "")
        if (!keyWord) return; // Handle cancel or empty input
        keyWord = keyWord.trim().toLowerCase()
        if (!keyWord || keyWord.length < 2) return
        let customValue = prompt("(Optional)\nYou can enter a value to replace it , or fill in nothing.", "")
        if (customValue === null) customValue = ''; // Handle cancel
        if (customValue) customValue = customValue.trim()
        const li = createcustomDictionary(keyWord,customValue)
        $("#customDictionary").appendChild(li)
        twpConfig.addKeyWordTocustomDictionary(keyWord,customValue)
    }

    // Enhanced translation service configuration with validation
    $("#pageTranslatorService").onchange = e => {
        const selectedService = e.target.value;
        
        // Validate service selection
        const validServices = ["google", "yandex", "llm"];
        if (!validServices.includes(selectedService)) {
            console.warn(`[Web Translator] Invalid service selected: ${selectedService}`);
            e.target.value = "google"; // Reset to default
            return;
        }
        
        try {
            twpConfig.set("pageTranslatorService", selectedService);
            toggleLLMConfigSection();
            
            // Log service change for debugging
            console.log(`[Web Translator] Page translator service changed to: ${selectedService}`);
        } catch (error) {
            console.error('[Web Translator] Failed to save page translator service:', error);
            // Reset to previous value
            e.target.value = twpConfig.get("pageTranslatorService");
        }
    };
    $("#pageTranslatorService").value = twpConfig.get("pageTranslatorService");

    $("#textTranslatorService").onchange = e => {
        const selectedService = e.target.value;
        
        // Validate service selection
        const validServices = ["google", "yandex", "bing", "deepl", "llm"];
        if (!validServices.includes(selectedService)) {
            console.warn(`[Web Translator] Invalid text service selected: ${selectedService}`);
            e.target.value = "google"; // Reset to default
            return;
        }
        
        try {
            twpConfig.set("textTranslatorService", selectedService);
            toggleLLMConfigSection();
            
            // Log service change for debugging
            console.log(`[Web Translator] Text translator service changed to: ${selectedService}`);
        } catch (error) {
            console.error('[Web Translator] Failed to save text translator service:', error);
            // Reset to previous value
            e.target.value = twpConfig.get("textTranslatorService");
        }
    };
    $("#textTranslatorService").value = twpConfig.get("textTranslatorService");

    /**
     * Enhanced LLM Configuration Section Toggle
     * Shows/hides LLM configuration based on service selection with error handling
     */
    function toggleLLMConfigSection() {
        try {
            const pageService = $("#pageTranslatorService").value;
            const textService = $("#textTranslatorService").value;
            const llmSection = $("#llmConfigSection");
            
            if (!llmSection) {
                console.warn('[Web Translator] LLM config section element not found');
                return;
            }
            
            // Show LLM section if either service uses LLM
            const shouldShowLLM = pageService === "llm" || textService === "llm";
            llmSection.style.display = shouldShowLLM ? "block" : "none";
            
            // Log visibility change for debugging
            console.log(`[Web Translator] LLM config section ${shouldShowLLM ? 'shown' : 'hidden'} (page: ${pageService}, text: ${textService})`);
            
        } catch (error) {
            console.error('[Web Translator] Error toggling LLM config section:', error);
        }
    }

    // LLM Settings handlers
    $("#enableLLM").onchange = e => {
        twpConfig.set("enableLLM", e.target.value)
    }
    $("#enableLLM").value = twpConfig.get("enableLLM")

    $("#llmProvider").onchange = e => {
        twpConfig.set("llmProvider", e.target.value)
        updateLLMProviderDefaults()
    }
    $("#llmProvider").value = twpConfig.get("llmProvider")

    $("#llmModel").oninput = e => {
        twpConfig.set("llmModel", e.target.value)
    }
    $("#llmModel").value = twpConfig.get("llmModel")

    $("#llmApiKey").oninput = e => {
        twpConfig.set("llmApiKey", e.target.value)
    }
    $("#llmApiKey").value = twpConfig.get("llmApiKey")

    $("#llmApiEndpoint").oninput = e => {
        twpConfig.set("llmApiEndpoint", e.target.value)
    }
    $("#llmApiEndpoint").value = twpConfig.get("llmApiEndpoint")

    $("#llmMaxTokens").oninput = e => {
        twpConfig.set("llmMaxTokens", parseInt(e.target.value))
    }
    $("#llmMaxTokens").value = twpConfig.get("llmMaxTokens")

    $("#llmTemperature").oninput = e => {
        twpConfig.set("llmTemperature", parseFloat(e.target.value))
    }
    $("#llmTemperature").value = twpConfig.get("llmTemperature")

    $("#llmTimeout").oninput = e => {
        twpConfig.set("llmTimeout", parseInt(e.target.value))
    }
    $("#llmTimeout").value = twpConfig.get("llmTimeout")

    $("#llmPromptTemplate").oninput = e => {
        twpConfig.set("llmPromptTemplate", e.target.value)
    }
    $("#llmPromptTemplate").value = twpConfig.get("llmPromptTemplate")

    function updateLLMProviderDefaults() {
        const provider = $("#llmProvider").value
        const modelInput = $("#llmModel")
        const endpointInput = $("#llmApiEndpoint")
        
        // Update default values based on provider
        switch (provider) {
            case 'openai':
                modelInput.value = 'gpt-3.5-turbo'
                endpointInput.value = 'https://api.openai.com/v1/chat/completions'
                twpConfig.set('llmModel', 'gpt-3.5-turbo')
                twpConfig.set('llmApiEndpoint', 'https://api.openai.com/v1/chat/completions')
                break
            case 'anthropic':
                modelInput.value = 'claude-3-sonnet-20240229'
                endpointInput.value = 'https://api.anthropic.com/v1/messages'
                twpConfig.set('llmModel', 'claude-3-sonnet-20240229')
                twpConfig.set('llmApiEndpoint', 'https://api.anthropic.com/v1/messages')
                break
            case 'google':
                modelInput.value = 'gemini-pro'
                endpointInput.value = 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent'
                twpConfig.set('llmModel', 'gemini-pro')
                twpConfig.set('llmApiEndpoint', 'https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent')
                break
            case 'azure':
                modelInput.value = 'gpt-35-turbo'
                endpointInput.value = 'https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2023-07-01-preview'
                twpConfig.set('llmModel', 'gpt-35-turbo')
                twpConfig.set('llmApiEndpoint', 'https://your-resource.openai.azure.com/openai/deployments/your-deployment/chat/completions?api-version=2023-07-01-preview')
                break
            case 'groq':
                modelInput.value = 'llama3-8b-8192'
                endpointInput.value = 'https://api.groq.com/openai/v1/chat/completions'
                twpConfig.set('llmModel', 'llama3-8b-8192')
                twpConfig.set('llmApiEndpoint', 'https://api.groq.com/openai/v1/chat/completions')
                break
            case 'ollama':
                modelInput.value = 'llama3'
                endpointInput.value = 'http://localhost:11434/v1/chat/completions'
                twpConfig.set('llmModel', 'llama3')
                twpConfig.set('llmApiEndpoint', 'http://localhost:11434/v1/chat/completions')
                break
            case 'cohere':
                modelInput.value = 'command'
                endpointInput.value = 'https://api.cohere.ai/v1/chat'
                twpConfig.set('llmModel', 'command')
                twpConfig.set('llmApiEndpoint', 'https://api.cohere.ai/v1/chat')
                break
            case 'mistral':
                modelInput.value = 'mistral-medium'
                endpointInput.value = 'https://api.mistral.ai/v1/chat/completions'
                twpConfig.set('llmModel', 'mistral-medium')
                twpConfig.set('llmApiEndpoint', 'https://api.mistral.ai/v1/chat/completions')
                break
            case 'deepseek':
                modelInput.value = 'deepseek-chat'
                endpointInput.value = 'https://api.deepseek.com/chat/completions'
                twpConfig.set('llmModel', 'deepseek-chat')
                twpConfig.set('llmApiEndpoint', 'https://api.deepseek.com/chat/completions')
                break
            case 'moonshot':
                modelInput.value = 'moonshot-v1-8k'
                endpointInput.value = 'https://api.moonshot.cn/v1/chat/completions'
                twpConfig.set('llmModel', 'moonshot-v1-8k')
                twpConfig.set('llmApiEndpoint', 'https://api.moonshot.cn/v1/chat/completions')
                break
            case 'zhipu':
                modelInput.value = 'glm-4'
                endpointInput.value = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
                twpConfig.set('llmModel', 'glm-4')
                twpConfig.set('llmApiEndpoint', 'https://open.bigmodel.cn/api/paas/v4/chat/completions')
                break
            case 'baichuan':
                modelInput.value = 'Baichuan2-Turbo'
                endpointInput.value = 'https://api.baichuan-ai.com/v1/chat/completions'
                twpConfig.set('llmModel', 'Baichuan2-Turbo')
                twpConfig.set('llmApiEndpoint', 'https://api.baichuan-ai.com/v1/chat/completions')
                break
            case 'qwen':
                modelInput.value = 'qwen-turbo'
                endpointInput.value = 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation'
                twpConfig.set('llmModel', 'qwen-turbo')
                twpConfig.set('llmApiEndpoint', 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation')
                break
            case 'custom':
                // No defaults for custom
                break
        }
    }

    // Initialize LLM section visibility
    toggleLLMConfigSection()
    updateLLMProviderDefaults()


    $("#translateTag_pre").onchange = e => {
        twpConfig.set("translateTag_pre", e.target.value)
    }
    $("#translateTag_pre").value = twpConfig.get("translateTag_pre")


    $("#dontSortResults").onchange = e => {
        twpConfig.set("dontSortResults", e.target.value)
    }
    $("#dontSortResults").value = twpConfig.get("dontSortResults")

    $("#translateDynamicallyCreatedContent").onchange = e => {
        twpConfig.set("translateDynamicallyCreatedContent", e.target.value)
    }
    $("#translateDynamicallyCreatedContent").value = twpConfig.get("translateDynamicallyCreatedContent")

    $("#autoTranslateWhenClickingALink").onchange = e => {
        if (e.target.value == "yes") {
            chrome.permissions.request({
                permissions: ["webNavigation"]
            }, granted => {
                if (granted) {
                    twpConfig.set("autoTranslateWhenClickingALink", "yes")
                } else {
                    twpConfig.set("autoTranslateWhenClickingALink", "no")
                    e.target.value = "no"
                }
            })
        } else {
            twpConfig.set("autoTranslateWhenClickingALink", "no")
            chrome.permissions.remove({
                permissions: ["webNavigation"]
            })
        }
    }
    $("#autoTranslateWhenClickingALink").value = twpConfig.get("autoTranslateWhenClickingALink")


    function enableOrDisableTranslateSelectedAdvancedOptions(value) {
        if (value === "no") {
            document.querySelectorAll("#translateSelectedAdvancedOptions input").forEach(input => {
                input.setAttribute("disabled", "")
            })
        } else {
            document.querySelectorAll("#translateSelectedAdvancedOptions input").forEach(input => {
                input.removeAttribute("disabled")
            })
        }
    }



    $("#isShowDualLanguage").onchange = e => {
        twpConfig.set("isShowDualLanguage", e.target.value)
    }
    $("#saveCustomDualStyle").onclick = e => {
       const customDualStyle = $("#customDualStyle").value;
       twpConfig.set("customDualStyle", customDualStyle)
    }
    if(twpConfig.get("customDualStyle") !== "") {
      $("#customDualStyle").value = twpConfig.get("customDualStyle")
    }
    $("#isShowDualLanguage").value = twpConfig.get("isShowDualLanguage")
    $("#dualStyle").onchange = e => {
        twpConfig.set("dualStyle", e.target.value)
    }
    $("#dualStyle").value = twpConfig.get("dualStyle")


    // hotkeys options
    function escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    $("#openNativeShortcutManager").onclick = e => {
        chrome.tabs.create({
            url: "chrome://extensions/shortcuts"
        })
    }

    const defaultShortcuts = {}
    for (const name of Object.keys(chrome.runtime.getManifest().commands || {})) {
        const info = chrome.runtime.getManifest().commands[name]
        if (info.suggested_key && info.suggested_key.default) {
            defaultShortcuts[name] = info.suggested_key.default
        } else {
            defaultShortcuts[name] = ""
        }
    }

    function addHotkey(hotkeyname, description) {
        if (hotkeyname === "_execute_browser_action" && !description) {
            description = "Enable the extension"
        }

        const li = document.createElement("li")
        li.classList.add("shortcut-row")
        li.setAttribute("id", hotkeyname)
        li.innerHTML = `
        <div>${description}</div>
        <div class="shortcut-input-options">
            <div style="position: relative;">
                <input name="input" class="w3-input w3-border shortcut-input" type="text" readonly placeholder="Enter a shortcut" data-i18n-placeholder="enterShortcut">
                <p name="error" class="shortcut-error" style="position: absolute;"></p>
            </div>
            <div class="w3-hover-light-grey shortcut-button" name="removeKey"><i class="gg-trash"></i></div>
            <div class="w3-hover-light-grey shortcut-button" name="resetKey"><i class="gg-sync"></i></div>
        </div>  
        `
        $("#KeyboardShortcuts").appendChild(li)

        const input = li.querySelector(`[name="input"]`)
        const error = li.querySelector(`[name="error"]`)
        const removeKey = li.querySelector(`[name="removeKey"]`)
        const resetKey = li.querySelector(`[name="resetKey"]`)

        const hotkeysValues = twpConfig.get("hotkeys");
        input.value = hotkeysValues[hotkeyname]
        if (input.value) {
            resetKey.style.display = "none"
        } else {
            removeKey.style.display = "none"
        }

        function setError(errorname) {
            const text = chrome.i18n.getMessage("hotkeyError_" + errorname)
            switch (errorname) {
                case "ctrlOrAlt":
                    error.textContent = text ? text : "Include Ctrl or Alt"
                    break
                case "letter":
                    error.textContent = text ? text : "Type a letter"
                    break
                case "invalid":
                    error.textContent = text ? text : "Invalid combination"
                    break
                default:
                    error.textContent = ""
                    break
            }
        }

        function getKeyString(e) {
            let result = ""
            // if mac use mac ctrl
            
            if(platformInfo.isMac){
              if (e.ctrlKey) {
                  result += "MacCtrl+"
              }
 
              if(e.metaKey) {
                  result += "Command+"
              }
            }else{
              if (e.ctrlKey) {
                result += "Ctrl+"
              }

            }
            if (e.altKey) {
                result += "Alt+"
            }
            if (e.shiftKey) {
                result += "Shift+"
            }
            if (e.code.match(/Key([A-Z])/)) {
                result += e.code.match(/Key([A-Z])/)[1]
            } else if (e.code.match(/Digit([0-9])/)) {
                result += e.code.match(/Digit([0-9])/)[1]
            }

            return result
        }

        function setShortcut(name, keystring) {
            const hotkeys = twpConfig.get("hotkeys")
            hotkeys[hotkeyname] = keystring
            twpConfig.set("hotkeys", hotkeys)
            browser.commands.update({
                name: name,
                shortcut: keystring
            })
        }

        function onkeychange(e) {
            input.value = getKeyString(e)

            if (e.Key == "Tab") {
                return
            }
            if (e.key == "Escape") {
                input.blur()
                return
            }
            if (e.key == "Backspace" || e.key == "Delete") {
                setShortcut(hotkeyname, getKeyString(e))
                input.blur()
                return
            }
            if (!e.ctrlKey && !e.altKey) {
                setError("ctrlOrAlt")
                return
            }
            if (e.ctrlKey && e.altKey && e.shiftKey) {
                setError("invalid")
                return
            }
            e.preventDefault()
            if (!e.code.match(/Key([A-Z])/) && !e.code.match(/Digit([0-9])/)) {
                setError("letter")
                return
            }

            setShortcut(hotkeyname, getKeyString(e))
            input.blur()

            setError("none")
        }

        input.onkeydown = e => onkeychange(e)
        input.onkeyup = e => onkeychange(e)

        input.onfocus = e => {
            input.value = ""
            setError("")
        }

        input.onblur = e => {
            input.value = twpConfig.get("hotkeys")[hotkeyname]
            setError("")
        }

        removeKey.onclick = e => {
            input.value = ""
            setShortcut(hotkeyname, "")

            removeKey.style.display = "none"
            resetKey.style.display = "block"
        }

        resetKey.onclick = e => {
            input.value = defaultShortcuts[hotkeyname]
            setShortcut(hotkeyname, defaultShortcuts[hotkeyname])

            removeKey.style.display = "block"
            resetKey.style.display = "none"
        }

        //*
        if (typeof browser === "undefined") {
            input.setAttribute("disabled", "")
            resetKey.style.display = "none"
            removeKey.style.display = "none"
        } else {
            $("#openNativeShortcutManager").style.display = "none"
        }
        // */
    }

    if (typeof chrome.commands !== "undefined") {
        chrome.commands.getAll(results => {
            for (const result of results) {
                addHotkey(result.name, result.description)
            }
        })
    }

    // storage options
    $("#deleteTranslationCache").onclick = e => {
        if (confirm(chrome.i18n.getMessage("doYouWantToDeleteTranslationCache"))) {
            chrome.runtime.sendMessage({
                action: "deleteTranslationCache",
                reload: true
            })
        }
    }

    $("#backupToFile").onclick = e => {
        const configJSON = twpConfig.export()

        const element = document.createElement('a')
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(configJSON))
        element.setAttribute('download', 'web-translator-backup_' + new Date().toISOString().replace(/T/, '_').replace(/\..+/, '').replace(/\:/g, ".") + ".txt")

        element.style.display = 'none'
        document.body.appendChild(element)

        element.click()

        document.body.removeChild(element)
    }
    $("#restoreFromFile").onclick = e => {
        const element = document.createElement('input')
        element.setAttribute('type', 'file')
        element.setAttribute('accept', 'text/plain')

        element.style.display = 'none'
        document.body.appendChild(element)

        element.oninput = e => {
            const input = e.target

            const reader = new FileReader()
            reader.onload = function () {
                try {
                    if (confirm(chrome.i18n.getMessage("doYouWantOverwriteAllSettings"))) {
                        twpConfig.import(reader.result)
                    }
                } catch (e) {
                    alert(chrome.i18n.getMessage("fileIsCorrupted"))
                    console.error(e)
                }
            }

            reader.readAsText(input.files[0])
        }

        element.click()

        document.body.removeChild(element)
    }
    $("#resetToDefault").onclick = e => {
        if (confirm(chrome.i18n.getMessage("doYouWantRestoreSettings"))) {
            twpConfig.restoreToDefault()
        }
    }


    $("#showPopupMobile").onchange = e => {
        twpConfig.set("showPopupMobile", e.target.value)
    }
    $("#showPopupMobile").value = twpConfig.get("showPopupMobile")

    $("#isTranslateTitle").onchange = e => {
        twpConfig.set("isTranslateTitle", e.target.value)
    }
    $("#isTranslateTitle").value = twpConfig.get("isTranslateTitle")

    $("#showTranslatePageContextMenu").onchange = e => {
        twpConfig.set("showTranslatePageContextMenu", e.target.value)
    }
    $("#showTranslatePageContextMenu").value = twpConfig.get("showTranslatePageContextMenu")

    $("#showButtonInTheAddressBar").onchange = e => {
        twpConfig.set("showButtonInTheAddressBar", e.target.value)
    }
    $("#showButtonInTheAddressBar").value = twpConfig.get("showButtonInTheAddressBar")

    $("#translateClickingOnce").onchange = e => {
        twpConfig.set("translateClickingOnce", e.target.value)
    }
    $("#translateClickingOnce").value = twpConfig.get("translateClickingOnce")



    $("#btnCalculateStorage").style.display = "inline-block"
    $("#storageUsed").style.display = "none"
    $("#btnCalculateStorage").onclick = e => {
        $("#btnCalculateStorage").style.display = "none"

        chrome.runtime.sendMessage({
            action: "getCacheSize"
        }, result => {
            $("#storageUsed").textContent = result
            $("#storageUsed").style.display = "inline-block"
        })
    }
})

window.scrollTo({
    top: 0
})
