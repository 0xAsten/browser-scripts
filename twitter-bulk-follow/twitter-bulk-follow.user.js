// ==UserScript==
// @name         Twitter Bulk Follow
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Automatically follow users on Twitter
// @author       https://x.com/0xasten
// @match        *://localhost:3000
// @match        *://twitter.com/*
// @match        *://x.com/*
// @match        *://x.com/intent/follow?screen_name=*
// @match        *://twitter.com/intent/follow?screen_name=*
// @grant        none
// ==/UserScript==

;(function () {
  'use strict'

  const CONFIG = {
    userListSelector: 'tbody tr',
    userLinkSelector: 'td:nth-child(2) a[href*="twitter.com/"]',
    usernameSelector: '.text-blue-300.text-sm',
    intentConfirmButtonSelector: '[data-testid="confirmationSheetConfirm"]',
  }

  // Generate a unique session ID for this script instance
  const SCRIPT_SESSION_ID =
    'tbf_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11)

  let processWebApp = () => {
    addControlPanel()

    document
      .getElementById('start-bulk-follow')
      .addEventListener('click', () => {
        startFollowProcess()
      })
  }

  let addControlPanel = () => {
    const panel = document.createElement('div')
    panel.style.position = 'fixed'
    panel.style.bottom = '70px'
    panel.style.left = '10px'
    panel.style.padding = '10px'
    panel.style.background = '#1a1e2e'
    panel.style.border = '1px solid #333'
    panel.style.zIndex = '9999'
    panel.style.borderRadius = '4px'
    panel.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)'
    panel.style.color = '#8bd5ff'

    panel.innerHTML = `
            <div style="font-weight:bold;margin-bottom:10px">Twitter Bulk Follow</div>
            <div style="margin-bottom:10px">
                <label for="start-index" style="font-size:12px;margin-bottom:3px">Start from influencer #:</label>
                <input type="number" id="start-index" min="1" value="1" style="width:70px;background:#2a2e3e;border:1px solid #444;border-radius:3px;padding:4px;color:white">
            </div>
            <div>
                <button id="start-bulk-follow" style="background:#1DA1F2;color:white;border:none;padding:5px 10px;border-radius:4px;cursor:pointer;transition:all 0.2s ease">
                    Start Follow
                </button>
                <button id="stop-bulk-follow" style="background:#E0245E;color:white;border:none;padding:5px 10px;border-radius:4px;margin-left:5px;cursor:pointer;transition:all 0.2s ease">
                    Stop Follow
                </button>
            </div>
            <div id="follow-status" style="margin-top:10px;font-size:12px;"></div>
        `

    document.body.appendChild(panel)

    // Add hover and click effects
    const startButton = document.getElementById('start-bulk-follow')
    const stopButton = document.getElementById('stop-bulk-follow')

    startButton.addEventListener('mouseover', () => {
      startButton.style.transform = 'scale(1.05)'
      startButton.style.boxShadow = '0 2px 5px rgba(29, 161, 242, 0.4)'
    })

    startButton.addEventListener('mouseout', () => {
      startButton.style.transform = 'scale(1)'
      startButton.style.boxShadow = 'none'
    })

    startButton.addEventListener('mousedown', () => {
      startButton.style.transform = 'scale(0.95)'
    })

    startButton.addEventListener('mouseup', () => {
      startButton.style.transform = 'scale(1.05)'
    })

    stopButton.addEventListener('mouseover', () => {
      stopButton.style.transform = 'scale(1.05)'
      stopButton.style.boxShadow = '0 2px 5px rgba(224, 36, 94, 0.4)'
    })

    stopButton.addEventListener('mouseout', () => {
      stopButton.style.transform = 'scale(1)'
      stopButton.style.boxShadow = 'none'
    })

    stopButton.addEventListener('mousedown', () => {
      stopButton.style.transform = 'scale(0.95)'
    })

    stopButton.addEventListener('mouseup', () => {
      stopButton.style.transform = 'scale(1.05)'
    })

    document
      .getElementById('stop-bulk-follow')
      .addEventListener('click', () => {
        window.stopBulkFollow = true
      })
  }

  let updateStatus = (message) => {
    const statusElement = document.getElementById('follow-status')
    if (statusElement) {
      statusElement.innerHTML = message
    }
    console.log(`Twitter Bulk Follow: ${message}`)
  }

  let startFollowProcess = () => {
    window.stopBulkFollow = false

    const userElements = document.querySelectorAll(CONFIG.userListSelector)
    const startIndex = Math.max(
      1,
      parseInt(document.getElementById('start-index').value) || 1,
    )
    updateStatus(`Found ${userElements.length} users`)

    processUsers(Array.from(userElements), startIndex - 1)
  }

  let processUsers = async (users, startFromIndex = 0) => {
    let processed = 0
    let i = startFromIndex

    const processNextUser = async () => {
      if (i >= users.length || window.stopBulkFollow) {
        updateStatus(`Completed: processed ${processed} users`)
        return
      }

      const user = users[i]
      i++

      const userLink = user.querySelector(CONFIG.userLinkSelector)

      if (userLink && !user.classList.contains('processed')) {
        user.classList.add('processed')
        processed++

        document.getElementById('start-index').value = i

        const username =
          user.querySelector(CONFIG.usernameSelector)?.innerText.trim() || ''

        updateStatus(
          `Processing user ${i}/${users.length} (${processed} processed)<br>${username}`,
        )

        if (username.startsWith('@')) {
          const usernameWithoutAt = username.substring(1)
          // Add the unique session ID as a URL parameter
          const intentUrl = `https://x.com/intent/follow?screen_name=${usernameWithoutAt}&script_id=${SCRIPT_SESSION_ID}`

          // Store the request ID in localStorage
          localStorage.setItem('twitter_bulk_follow_active', SCRIPT_SESSION_ID)
          const newWindow = window.open(intentUrl, '_blank')

          // Wait for the window to be processed and closed before continuing
          await new Promise((resolve) => {
            const checkClosed = setInterval(() => {
              if (
                localStorage.getItem('twitter_bulk_follow_active') !==
                  SCRIPT_SESSION_ID ||
                newWindow.closed
              ) {
                clearInterval(checkClosed)
                localStorage.removeItem('twitter_bulk_follow_active')
                setTimeout(resolve, 3000)
              }
            }, 1000)
          })
        }
      }

      // Process next user
      await processNextUser()
    }

    // Start processing
    await processNextUser()
  }

  let processTwitterPage = () => {
    const currentUrl = window.location.href
    const isIntentPage = currentUrl.includes('/intent/follow')

    if (isIntentPage) {
      // Extract the script_id from the URL parameters
      const urlParams = new URLSearchParams(window.location.search)
      const scriptId = urlParams.get('script_id')

      // Only proceed if this intent page was opened by our script
      if (!scriptId) {
        console.log(
          'This intent page was not opened by the Twitter Bulk Follow script',
        )
        return
      }

      const checkForButton = () => {
        const confirmButton = document.querySelector(
          CONFIG.intentConfirmButtonSelector,
        )
        if (confirmButton) {
          setTimeout(() => {
            confirmButton.click()

            setTimeout(() => {
              // Signal to the main window that we're done using the same script ID
              localStorage.setItem('twitter_bulk_follow_active', 'false')
              window.close()
            }, 1000)
          }, 1000)
        } else {
          setTimeout(checkForButton, 1000)
        }
      }

      checkForButton()
    }
  }

  const init = () => {
    const currentUrl = window.location.href

    if (currentUrl.includes('twitter.com') || currentUrl.includes('x.com')) {
      processTwitterPage()
    } else {
      processWebApp()
    }
  }

  if (document.readyState === 'complete') {
    init()
  } else {
    window.addEventListener('load', init)
  }
})()
