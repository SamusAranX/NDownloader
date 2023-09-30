/* globals chrome */
"use strict";

function setBadgeText(tabId, text) {
	chrome.action.setBadgeBackgroundColor({
		"tabId": tabId,
		"color": "#e60012"
	});
	chrome.action.setBadgeText({
		"tabId": tabId,
		"text": text
	});
}

chrome.webNavigation.onCompleted.addListener(details => {
	if (!/^https:\/\/my\.nintendo\.com\/rewards\/.+/gmi.test(details.url)) {
		return;
	}

	let activeTab = details.tabId;
	try {
		chrome.scripting
			.executeScript({
				target: { tabId: activeTab },
				files: ["script/script.js"],
			})
			.then(injectionResults => {
				if (!injectionResults) {
					return;
				}

				let result = injectionResults[0];
				if (!result.result) {
					return;
				}

				if (result.result.error) {
					setBadgeText(activeTab, "!");
					return;
				}

				let numURLs = result.result.rewards.length;
				setBadgeText(activeTab, numURLs.toString());
			},
			error => {
				console.error(error);
			});
	} catch (exc) {
		console.error(exc);
	}
});