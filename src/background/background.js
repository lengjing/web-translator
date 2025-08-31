"use strict";

// Avoid outputting the error message "Receiving end does not exist" in the Console.
function checkedLastError() {
    chrome.runtime.lastError
}

// get mimetype
var tabToMimeType = {}
chrome.webRequest.onHeadersReceived.addListener(function(details) {
    if (details.tabId !== -1) {
        let contentTypeHeader = null
        for (const header of details.responseHeaders) {
            if (header.name.toLowerCase() === 'content-type') {
                contentTypeHeader = header
                break
            }
        }
        tabToMimeType[details.tabId] = contentTypeHeader && contentTypeHeader.value.split(';', 1)[0]
    }
}, {
    urls: ['*://*/*'],
    types: ['main_frame']
}, ['responseHeaders']);

let currentScheme = 'light'
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getMainFramePageLanguageState") {
        chrome.tabs.sendMessage(sender.tab.id, {
            action: "getCurrentPageLanguageState"
        }, {
            frameId: 0
        }, pageLanguageState => {
            checkedLastError()
            sendResponse(pageLanguageState)
        })

        return true
    } else if (request.action === "getMainFrameTabLanguage") {
        chrome.tabs.sendMessage(sender.tab.id, {
            action: "getOriginalTabLanguage"
        }, {
            frameId: 0
        }, tabLanguage => {
            checkedLastError()
            sendResponse(tabLanguage)
        })

        return true
    } else if (request.action === "setPageLanguageState") {
        updateContextMenu(request.pageLanguageState)
    } else if (request.action === "openOptionsPage") {
        chrome.tabs.create({
            url: chrome.runtime.getURL("/options/options.html")
        })
    } else if (request.action === "openDonationPage") {
        chrome.tabs.create({
            url: chrome.runtime.getURL("/options/options.html#donation")
        })
    } else if (request.action === "detectTabLanguage") {
        if (!sender.tab) {
            // https://github.com/FilipePS/Traduzir-paginas-web/issues/478
            sendResponse("und")
            return
        }
        try {
            chrome.tabs.detectLanguage(sender.tab.id, result => sendResponse(result))
        } catch (e) {
            console.error(e)
            sendResponse("und")
        }

        return true
    } else if (request.action === "getTabHostName") {
        sendResponse(new URL(sender.tab.url).hostname)
    }else if (request.action === "getTabUrl") {
        sendResponse((sender.tab.url))
    } else if (request.action === "thisFrameIsInFocus") {
        chrome.tabs.sendMessage(sender.tab.id, {action: "anotherFrameIsInFocus"}, checkedLastError)
    } else if (request.action === "getTabMimeType") {
        chrome.tabs.query({active: true, currentWindow: true}, tabs => {
            if(tabs && tabs.length > 0) {
             sendResponse(tabToMimeType[tabs[0].id])
            }else{
              sendResponse(null)
            }
        })
        return true
    }else if(request.action ==='detectLanguage'){
        chrome.i18n.detectLanguage(request.text, function(result){
          if(result.languages.length > 0){
            sendResponse(result.languages[0].language);
          }else{
            sendResponse(undefined);
          }
        });
        return true
    }
})


function updateContextMenu(pageLanguageState = "original") {
    let contextMenuTitle
    if (pageLanguageState === "translated") {
        contextMenuTitle = chrome.i18n.getMessage("btnRestore")
    } else {
        const targetLanguage = twpConfig.get("targetLanguage")
        contextMenuTitle = chrome.i18n.getMessage("msgTranslateFor", twpLang.codeToLanguage(targetLanguage))
    }
    if (typeof chrome.contextMenus != 'undefined') {
        chrome.contextMenus.remove("translate-web-page", checkedLastError)
        if (twpConfig.get("showTranslatePageContextMenu") == "yes") {
            chrome.contextMenus.create({
                id: "translate-web-page",
                title: contextMenuTitle,
                contexts: ["page", "frame"]
            })
        }
    }
}

chrome.runtime.onInstalled.addListener(details => {
    if (details.reason == "install") {
        chrome.tabs.create({
            url: chrome.runtime.getURL("/options/options.html")
        })
    } else if (details.reason == "update" && chrome.runtime.getManifest().version != details.previousVersion) {
        twpConfig.onReady(async () => {
            translationCache.deleteTranslationCache()
            if (platformInfo.isMobile.any) return;
            // delete hotkeys from old versions
            // get current hostkeys 
            
            if (typeof chrome.commands !== "undefined") {
              chrome.commands.getAll((results) => {
                try {
                  const hotKeys = [];
                  const configHotKeys = twpConfig.get("hotKeys") || {};
                  for (const result of results) {
                    hotKeys[result.name] = configHotKeys[result.name] || result.shortcut;
                  }
                  twpConfig.set("hotkeys",hotKeys);
                } catch (e) {
                  console.error(e);
                } 
              });
            }
        })
    }

    twpConfig.onReady(async () => {
        if (platformInfo.isMobile.any) {
            twpConfig.set("enableDeepL", "no")
        }
    })
})

function resetPageAction(tabId, forceShow = false) {
    if (twpConfig.get("translateClickingOnce") === "yes" && !forceShow) {
        chrome.pageAction.setPopup({
            popup: null,
            tabId
        })
    } else {
            chrome.pageAction.setPopup({
                popup: "popup/old-popup.html",
                tabId
            })
    }
}

function resetBrowserAction(forceShow = false) {
    if (twpConfig.get("translateClickingOnce") === "yes" && !forceShow) {
        chrome.browserAction.setPopup({
            popup: null
        })
    } else {
            chrome.browserAction.setPopup({
                popup: "popup/old-popup.html"
            })
    }
}

if (typeof chrome.contextMenus !== "undefined") {
    chrome.contextMenus.removeAll()
    chrome.contextMenus.create({
        id: "browserAction-showPopup",
        title: chrome.i18n.getMessage("btnShowPopup"),
        contexts: ["browser_action"]
    })
    chrome.contextMenus.create({
        id: "pageAction-showPopup",
        title: chrome.i18n.getMessage("btnShowPopup"),
        contexts: ["page_action"]
    })
    chrome.contextMenus.create({
        id: "never-translate",
        title: chrome.i18n.getMessage("btnNeverTranslate"),
        contexts: ["browser_action", "page_action"]
    })
    chrome.contextMenus.create({
        id: "more-options",
        title: chrome.i18n.getMessage("btnMoreOptions"),
        contexts: ["browser_action", "page_action"]
    })
    chrome.contextMenus.create({
        id: "browserAction-pdf-to-html",
        title: chrome.i18n.getMessage("msgPDFtoHTML"),
        contexts: ["browser_action"]
    })
    chrome.contextMenus.create({
        id: "pageAction-pdf-to-html",
        title: chrome.i18n.getMessage("msgPDFtoHTML"),
        contexts: ["page_action"]
    })

    const tabHasContentScript = {}

    chrome.contextMenus.onClicked.addListener((info, tab) => {
        if (info.menuItemId == "translate-web-page") {
            // check is pdf
            const isPdf =  globalIsPdf(tab)
            if(isPdf) {
              // show popup
              resetBrowserAction(true)
              chrome.browserAction.openPopup()
              resetBrowserAction()

            }else{
              chrome.tabs.sendMessage(tab.id, {
                  action: "toggle-translation"
              }, checkedLastError)
            }
        } else if (info.menuItemId == "browserAction-showPopup") {
            resetBrowserAction(true)

            chrome.browserAction.openPopup()

            resetBrowserAction()
        } else if (info.menuItemId == "pageAction-showPopup") {
            resetPageAction(tab.id, true)

            chrome.pageAction.openPopup()

            resetPageAction(tab.id)
        } else if (info.menuItemId == "never-translate") {
            const hostname = new URL(tab.url).hostname
            twpConfig.addSiteToNeverTranslate(hostname)
        } else if (info.menuItemId == "more-options") {
            chrome.tabs.create({
                url: chrome.runtime.getURL("/options/options.html")
            })
        } else if (info.menuItemId == "browserAction-pdf-to-html") {
            const mimeType = tabToMimeType[tab.id]
            if (mimeType && mimeType.toLowerCase() === "application/pdf" && typeof chrome.browserAction.openPopup !== 'undefined') {
                chrome.browserAction.openPopup()
            } else {
                chrome.tabs.create({
                    url: "https://translatewebpages.org/"
                })
            }
        } else if (info.menuItemId == "pageAction-pdf-to-html") {
            const mimeType = tabToMimeType[tab.id]
            if (mimeType && mimeType.toLowerCase() === "application/pdf" && typeof chrome.pageAction.openPopup !== 'undefined') {
                chrome.pageAction.openPopup()
            } else {
                chrome.tabs.create({
                    url: "https://translatewebpages.org/"
                })
            }
        }
    })

    chrome.tabs.onActivated.addListener(activeInfo => {
        twpConfig.onReady(() => updateContextMenu())
        chrome.tabs.sendMessage(activeInfo.tabId, {
            action: "getCurrentPageLanguageState"
        }, {
            frameId: 0
        }, pageLanguageState => {
            checkedLastError()
            if (pageLanguageState) {
                twpConfig.onReady(() => updateContextMenu(pageLanguageState))
            }
        })
    })

    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
        if (tab.active && changeInfo.status == "loading") {
            twpConfig.onReady(() => updateContextMenu())
        } else if (changeInfo.status == "complete") {
            chrome.tabs.sendMessage(tabId, {
                action: "contentScriptIsInjected"
            }, {
                frameId: 0
            }, response => {
                checkedLastError()
                tabHasContentScript[tabId] = !!response;
            })
        }
    })

    chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
        delete tabHasContentScript[tabId]
    })

    chrome.tabs.query({}, tabs =>
        tabs.forEach(tab =>
            chrome.tabs.sendMessage(tab.id, {
                action: "contentScriptIsInjected"
            }, {
                frameId: 0
            }, response => {
                checkedLastError()
                if (response) {
                    tabHasContentScript[tab.id] = true
                }
            })))
}

twpConfig.onReady(() => {
    if (platformInfo.isMobile.any) {
        chrome.tabs.query({}, tabs => tabs.forEach(tab => chrome.pageAction.hide(tab.id)))

        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status == "loading") {
                chrome.pageAction.hide(tabId)
            }
        })

        chrome.browserAction.onClicked.addListener(tab => {
            chrome.tabs.sendMessage(tab.id, {
                action: "showPopupMobile"
            }, {
                frameId: 0
            }, checkedLastError)
        })
    } else {
        if (chrome.pageAction) {
            chrome.pageAction.onClicked.addListener(tab => {
                if (twpConfig.get("translateClickingOnce") === "yes") {
                    chrome.tabs.sendMessage(tab.id, {
                        action: "toggle-translation"
                    }, checkedLastError)
                }
            })

        }
        chrome.browserAction.onClicked.addListener(tab => {
            if (twpConfig.get("translateClickingOnce") === "yes") {
                chrome.tabs.sendMessage(tab.id, {
                    action: "toggle-translation"
                }, checkedLastError)
            }
        })

        resetBrowserAction()

        twpConfig.onChanged((name, newvalue) => {
            switch (name) {
                case "translateClickingOnce":
                    resetBrowserAction()
                    chrome.tabs.query({
                        currentWindow: true,
                        active: true
                    }, tabs => {
                        resetPageAction(tabs[0].id)
                    })
                    break
            }
        })

        if (chrome.pageAction && browser) {
            let pageLanguageState = "original"

            let themeColorPopupText = null
            browser.theme.getCurrent().then(theme => {
                themeColorPopupText = null
                if (theme.colors && (theme.colors.toolbar_field_text || theme.colors.popup_text)) {
                    themeColorPopupText = theme.colors.toolbar_field_text || theme.colors.popup_text
                }
                updateIconInAllTabs()
            })

            chrome.theme.onUpdated.addListener(updateInfo => {
                themeColorPopupText = null
                if (updateInfo.theme.colors && (updateInfo.theme.colors.toolbar_field_text || updateInfo.theme.colors.popup_text)) {
                    themeColorPopupText = updateInfo.theme.colors.toolbar_field_text || updateInfo.theme.colors.popup_text
                }
                updateIconInAllTabs()
            })

            let darkMode = false
            darkMode = matchMedia("(prefers-color-scheme: dark)").matches;
            updateIconInAllTabs()

            matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
                darkMode = matchMedia("(prefers-color-scheme: dark)").matches;
                updateIconInAllTabs()
            })

            function getSVGIcon() {
                const currentService = twpConfig.get("pageTranslatorService")
                let svgXml
                
                if (currentService === "yandex") {
                    // Yandex service icon - simplified Y symbol
                    svgXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="300" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="$(fill);" fill-opacity="$(fill-opacity);">Y</text>
                    </svg>`
                } else if (currentService === "llm") {
                    // LLM service icon - AI/brain symbol
                    svgXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path fill="$(fill);" fill-opacity="$(fill-opacity);" d="M184 0c30.9 0 56 25.1 56 56V456c0 30.9-25.1 56-56 56c-28.9 0-52.7-21.9-55.7-50.1c-5.2 1.4-10.7 2.1-16.3 2.1c-35.3 0-64-28.7-64-64c0-7.4 1.3-14.6 3.6-21.2C21.4 367.4 0 338.2 0 304c0-31.9 18.7-59.5 45.8-72.3C37.1 220.8 32 207 32 192c0-30.7 21.6-56.3 50.4-62.6C80.8 123.9 80 118 80 112c0-29.9 20.6-55.1 48.3-62.1C131.3 21.9 155.1 0 184 0zM328 0c28.9 0 52.6 21.9 55.7 49.9c27.8 7 48.3 32.1 48.3 62.1c0 6-.8 11.9-2.4 17.4c28.8 6.2 50.4 31.9 50.4 62.6c0 15-5.1 28.8-13.8 39.7C493.3 244.5 512 272.1 512 304c0 34.2-21.4 63.4-51.6 74.8c2.3 6.6 3.6 13.8 3.6 21.2c0 35.3-28.7 64-64 64c-5.6 0-11.1-.7-16.3-2.1c-3 28.2-26.8 50.1-55.7 50.1c-30.9 0-56-25.1-56-56V56c0-30.9 25.1-56 56-56z"/>
                    </svg>`
                } else {
                    // Google service icon - original translate symbol
                    svgXml = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                        <path fill="$(fill);" fill-opacity="$(fill-opacity);" d="M 45 0 C 20.186 0 0 20.186 0 45 L 0 347 C 0 371.814 20.186 392 45 392 L 301 392 C 305.819 392 310.34683 389.68544 313.17383 385.77344 C 315.98683 381.84744 316.76261 376.82491 315.22461 372.25391 L 195.23828 10.269531 A 14.995 14.995 0 0 0 181 0 L 45 0 z M 114.3457 107.46289 L 156.19336 107.46289 C 159.49489 107.46289 162.41322 109.61359 163.39258 112.76367 L 163.38281 112.77539 L 214.06641 276.2832 C 214.77315 278.57508 214.35913 281.05986 212.93555 282.98828 C 211.52206 284.90648 209.27989 286.04688 206.87695 286.04688 L 179.28516 286.04688 C 175.95335 286.04687 173.01546 283.86624 172.06641 280.67578 L 159.92969 240.18945 L 108.77148 240.18945 L 97.564453 280.52344 C 96.655774 283.77448 93.688937 286.03711 90.306641 286.03711 L 64.347656 286.03711 C 61.954806 286.03711 59.71461 284.90648 58.291016 282.98828 C 56.867422 281.05986 56.442021 278.57475 57.138672 276.29297 L 107.14648 112.79492 C 108.11572 109.62465 111.03407 107.46289 114.3457 107.46289 z M 133.39648 137.70117 L 114.55664 210.03125 L 154.06445 210.03125 L 133.91211 137.70117 L 133.39648 137.70117 z " />
                        <path fill="$(fill);" fill-opacity="$(fill-opacity);" d="M226.882 378.932c28.35 85.716 26.013 84.921 34.254 88.658a14.933 14.933 0 0 0 6.186 1.342c5.706 0 11.16-3.274 13.67-8.809l36.813-81.19z" />
                        <g>
                        <path fill="$(fill);" fill-opacity="$(fill-opacity);" d="M467 121H247.043L210.234 10.268A15 15 0 0 0 196 0H45C20.187 0 0 20.187 0 45v301c0 24.813 20.187 45 45 45h165.297l36.509 110.438c2.017 6.468 7.999 10.566 14.329 10.566.035 0 .07-.004.105-.004h205.761c24.813 0 45-20.187 45-45V166C512 141.187 491.813 121 467 121zM45 361c-8.271 0-15-6.729-15-15V45c0-8.271 6.729-15 15-15h140.179l110.027 331H45zm247.729 30l-29.4 64.841L241.894 391zM482 467c0 8.271-6.729 15-15 15H284.408l45.253-99.806a15.099 15.099 0 0 0 .571-10.932L257.015 151H467c8.271 0 15 6.729 15 15z" />
                        <path fill="$(fill);" fill-opacity="$(fill-opacity);" d="M444.075 241h-45v-15c0-8.284-6.716-15-15-15-8.284 0-15 6.716-15 15v15h-45c-8.284 0-15 6.716-15 15 0 8.284 6.716 15 15 15h87.14c-4.772 14.185-15.02 30.996-26.939 47.174a323.331 323.331 0 0 1-7.547-10.609c-4.659-6.851-13.988-8.628-20.838-3.969-6.85 4.658-8.627 13.988-3.969 20.839 4.208 6.189 8.62 12.211 13.017 17.919-7.496 8.694-14.885 16.57-21.369 22.94-5.913 5.802-6.003 15.299-.2 21.212 5.777 5.889 15.273 6.027 21.211.201.517-.508 8.698-8.566 19.624-20.937 10.663 12.2 18.645 20.218 19.264 20.837 5.855 5.855 15.35 5.858 21.208.002 5.858-5.855 5.861-15.352.007-21.212-.157-.157-9.34-9.392-21.059-23.059 21.233-27.448 34.18-51.357 38.663-71.338h1.786c8.284 0 15-6.716 15-15 0-8.284-6.715-15-14.999-15z" />
                        </g>
                    </svg>`
                }

                let svg64
                if (pageLanguageState === "translated" && twpConfig.get("popupBlueWhenSiteIsTranslated") === "yes") {
                    svg64 = svgXml.replace(/\$\(fill\-opacity\)\;/g, "1.0")
                    svg64 = btoa(svg64.replace(/\$\(fill\)\;/g, "#45a1ff"))
                } else {
                    svg64 = svgXml.replace(/\$\(fill\-opacity\)\;/g, "0.5")
                    if (themeColorPopupText) {
                        svg64 = btoa(svg64.replace(/\$\(fill\)\;/g, themeColorPopupText))
                    } else if (darkMode) {
                        svg64 = btoa(svg64.replace(/\$\(fill\)\;/g, "white"))
                    } else {
                        svg64 = btoa(svg64.replace(/\$\(fill\)\;/g, "black"))
                    }
                }

                const b64Start = 'data:image/svg+xml;base64,';
                return b64Start + svg64
            }

            function updateIcon(tabId) {
                resetPageAction(tabId)
                chrome.pageAction.setIcon({
                    tabId: tabId,
                    path: getSVGIcon()
                })

                if (twpConfig.get("showButtonInTheAddressBar") == "no") {
                    chrome.pageAction.hide(tabId)
                } else {
                    chrome.pageAction.show(tabId)
                }
            }

            function updateIconInAllTabs() {
                chrome.tabs.query({}, tabs =>
                    tabs.forEach(tab => updateIcon(tab.id)))
            }

            chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
                if (changeInfo.status == "loading") {
                    pageLanguageState = "original"
                    updateIcon(tabId)
                }
            })

            chrome.tabs.onActivated.addListener(activeInfo => {
                pageLanguageState = "original"
                updateIcon(activeInfo.tabId)
                chrome.tabs.sendMessage(activeInfo.tabId, {
                    action: "getCurrentPageLanguageState"
                }, {
                    frameId: 0
                }, _pageLanguageState => {
                    checkedLastError()
                    if (_pageLanguageState) {
                        pageLanguageState = _pageLanguageState
                        updateIcon(activeInfo.tabId)
                    }
                })
            })

            chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
                if (request.action === "setPageLanguageState") {
                    pageLanguageState = request.pageLanguageState
                    updateIcon(sender.tab.id)
                }
            })

            twpConfig.onChanged((name, newvalue) => {
                switch (name) {
                    case "showButtonInTheAddressBar":
                        updateIconInAllTabs()
                        break
                    case "pageTranslatorService":
                        updateIconInAllTabs()
                        break
                }
            })
        }
    }
})

if (typeof chrome.commands !== "undefined") {
    chrome.commands.onCommand.addListener(command => {
        if (command === "hotkey-toggle-translation") {
            chrome.tabs.query({
                currentWindow: true,
                active: true
            }, tabs => {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "toggle-translation"
                }, checkedLastError)
            })
        }else if (command === "hotkey-toggle-dual") {
            if (twpConfig.get("isShowDualLanguage") === "yes") {
                twpConfig.set("isShowDualLanguage", "no")
            } else {
                twpConfig.set("isShowDualLanguage", "yes")
            }
            chrome.tabs.query({
                currentWindow: true,
                active: true
            }, tabs => {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "toggle-translation"
                }, checkedLastError)
                chrome.tabs.query({
                    currentWindow: true,
                    active: true
                }, tabs => {
                    chrome.tabs.sendMessage(tabs[0].id, {
                        action: "toggle-translation"
                    }, checkedLastError)
                })
            })
        
        } else if (command === "hotkey-swap-page-translation-service") {
            // Delegate service switching to content script for consistency
            // This ensures all switching logic is centralized in pageTranslator.js
            chrome.tabs.query({
                active: true,
                currentWindow: true
            }, tabs => {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "swapTranslationService"
                }, checkedLastError)
            })
        } 

    })
}

twpConfig.onReady(async () => {
    updateContextMenu()

     if (!twpConfig.get("installDateTime")) {
        twpConfig.set("installDateTime", Date.now())
    }
})

twpConfig.onReady(async () => {
    let activeTabTranslationInfo = {}

    function tabsOnActivated(activeInfo) {
        chrome.tabs.query({
            active: true,
            currentWindow: true
        }, tabs => {
            activeTabTranslationInfo = {
                tabId: tabs[0].id,
                pageLanguageState: "original",
                url: tabs[0].url
            }
            chrome.tabs.sendMessage(tabs[0].id, {
                action: "getCurrentPageLanguageState"
            }, {
                frameId: 0
            }, pageLanguageState => {
                activeTabTranslationInfo = {
                    tabId: tabs[0].id,
                    pageLanguageState,
                    url: tabs[0].url
                }
            })
        })
    }

    let sitesToAutoTranslate = {}

    function tabsOnRemoved(tabId) {
        delete sitesToAutoTranslate[tabId]
    }

    function runtimeOnMessage(request, sender, sendResponse) {
        if (request.action === "setPageLanguageState") {
            if (sender.tab.active) {
                activeTabTranslationInfo = {
                    tabId: sender.tab.id,
                    pageLanguageState: request.pageLanguageState,
                    url: sender.tab.url
                }
            }
        }
    }

    function webNavigationOnCommitted(details) {
        if (details.transitionType === "link" && details.frameId === 0 &&
            activeTabTranslationInfo.pageLanguageState === "translated" &&
            new URL(activeTabTranslationInfo.url).host === new URL(details.url).host) {
            sitesToAutoTranslate[details.tabId] = new URL(details.url).host
        } else {
            delete sitesToAutoTranslate[details.tabId]
        }
    }

    function webNavigationOnDOMContentLoaded(details) {
        if (details.frameId === 0) {
            const host = new URL(details.url).host
            if (sitesToAutoTranslate[details.tabId] === host) {
                setTimeout(() =>
                    chrome.tabs.sendMessage(details.tabId, {
                        action: "autoTranslateBecauseClickedALink"
                    }, {
                        frameId: 0
                    }), 700)
            }
            delete sitesToAutoTranslate[details.tabId]
        }
    }

    function enableTranslationOnClickingALink() {
        disableTranslationOnClickingALink()
        if (!chrome.webNavigation) return;

        chrome.tabs.onActivated.addListener(tabsOnActivated)
        chrome.tabs.onRemoved.addListener(tabsOnRemoved)
        chrome.runtime.onMessage.addListener(runtimeOnMessage)
        chrome.webNavigation.onCommitted.addListener(webNavigationOnCommitted)
        chrome.webNavigation.onDOMContentLoaded.addListener(webNavigationOnDOMContentLoaded)
    }

    function disableTranslationOnClickingALink() {
        activeTabTranslationInfo = {}
        sitesToAutoTranslate = {}
        chrome.tabs.onActivated.removeListener(tabsOnActivated)
        chrome.tabs.onRemoved.removeListener(tabsOnRemoved)
        chrome.runtime.onMessage.removeListener(runtimeOnMessage)

        if (chrome.webNavigation) {
            chrome.webNavigation.onCommitted.removeListener(webNavigationOnCommitted)
            chrome.webNavigation.onDOMContentLoaded.removeListener(webNavigationOnDOMContentLoaded)
        } else {
            console.info("No webNavigation permission")
        }
    }

    twpConfig.onChanged((name, newvalue) => {
        if (name === "autoTranslateWhenClickingALink") {
            if (newvalue == "yes") {
                enableTranslationOnClickingALink()
            } else {
                disableTranslationOnClickingALink()
            }
        }
    })

    chrome.permissions.onRemoved.addListener(permissions => {
        if (permissions.permissions.indexOf("webNavigation") !== -1) {
            twpConfig.set("autoTranslateWhenClickingALink", "no")
        }
    })

    chrome.permissions.contains({
        permissions: ["webNavigation"]
    }, hasPermissions => {
        if (hasPermissions && twpConfig.get("autoTranslateWhenClickingALink") === "yes") {
            enableTranslationOnClickingALink()
        } else {
            twpConfig.set("autoTranslateWhenClickingALink", "no")
        }
    })
})
