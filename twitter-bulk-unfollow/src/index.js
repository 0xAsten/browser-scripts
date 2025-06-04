// ==UserScript==
// @name         Twitter(X) Bulk Unfollow (Modern)
// @namespace    http://tampermonkey.net/
// @version      2025-05-24
// @description  Automatically unfollow users on Twitter, supports English and Chinese UI.
// @author       https://x.com/0xasten
// @match        https://x.com/*/following
// @icon         https://raw.githubusercontent.com/0xAsten/browser-scripts/refs/heads/main/twitter-bulk-unfollow/assets/favicon.ico
// @homepage     https://github.com/0xAsten/browser-scripts
// @supportURL   https://github.com/0xAsten/browser-scripts/issues
// @grant        none
// @esversion    8
// ==/UserScript==

;(function () {
  'use strict'

  console.log('start')
  setTimeout(() => {
    const confirmStart = confirm(
      'Are you sure you want to start bulk unfollowing? Click "OK" to continue, "Cancel" to stop.\n\nFor bugs or feature requests: https://github.com/0xAsten/twitter-bulk-unfollow',
    )

    if (!confirmStart) {
      console.log('User canceled the operation')
      return
    }

    let count = 0
    const interval = setInterval(() => {
      const buttons = document.querySelectorAll(
        'button[aria-label^="Following"], button[aria-label^="正在关注"]',
      )
      if (buttons.length === 0) {
        clearInterval(interval)
        alert(
          `Complete, removed ${count} followings\n\nFor bugs or feature requests: https://github.com/0xAsten/browser-scripts`,
        )
        return
      }
      const btn = buttons[0]
      btn.click()
      count++

      setTimeout(() => {
        const confirm = document.querySelector(
          'button[data-testid="confirmationSheetConfirm"]',
        )
        if (confirm) confirm.click()
      }, 500)
    }, 2000)
  }, 5000)
})()
