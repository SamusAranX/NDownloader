/* globals chrome */
"use strict";

var rewardTitle = "";
var rewards = [];

var divMessage, paraMessage, divInfo, spanURLNumber, spanRewardTitle, selRewards;
var btnDownloadSel, btnDownloadAll;

const MIN_LIST_SIZE = 1;
const MAX_LIST_SIZE = 15;

function downloadSuggestionHandler(downloadItem, suggest) {
	let filename = downloadItem.filename;

	if (rewardTitle !== "") {
		suggest({filename: `${rewardTitle}/${filename}`, conflictAction: "overwrite"});
		return;
	}

	suggest({filename: filename, conflictAction: "overwrite"});
}

function downloadFromOptionList(optionElements) {
	let downloadOptions = Array.from(optionElements).map(o => {
		let url = o.value;

		return {
			conflictAction: "overwrite",
			url: url
		};
	});

	for (var i = 0; i < downloadOptions.length; i++) {
		chrome.downloads.download(downloadOptions[i]);
	}
}

function downloadSelectedFiles(e) {
	downloadFromOptionList(selRewards.selectedOptions);
}

function downloadAllFiles(e) {
	downloadFromOptionList(selRewards.options);
}

function prepareExt(manifest) {
	chrome.downloads.onDeterminingFilename.addListener(downloadSuggestionHandler);

	document.getElementById("ext-version").innerHTML = `v${manifest.version}`;

	divMessage       = document.querySelector("div.container.message");
	paraMessage      = document.querySelector("#message");
	divInfo          = document.querySelector("div.info");
	spanURLNumber    = divInfo.querySelector("p.num-urls span");
	spanRewardTitle  = divInfo.querySelector("p.reward-title span");
	selRewards       = document.querySelector("#url-list");

	btnDownloadSel = document.querySelector("#btn-download-sel");
	btnDownloadAll = document.querySelector("#btn-download-all");

	btnDownloadSel.addEventListener("click", downloadSelectedFiles);
	btnDownloadAll.addEventListener("click", downloadAllFiles);
}

function deadEnd() {
	btnDownloadSel.disabled = true;
	btnDownloadAll.disabled = true;

	document.body.classList.add("dead-end");
}

function handleUnsupportedSite() {
	deadEnd();

	paraMessage.innerHTML = "This extension only works on My Nintendo Reward pages.";
	document.body.classList.add("warning");
}

function handleError(err) {
	deadEnd();

	divMessage.classList.add("error");

	if (!err) {
		paraMessage.innerHTML = "Something went wrong.";
		return;
	}

	console.trace(err);
	if (err instanceof Error)
		paraMessage.innerHTML = err.message;
	else
		paraMessage.innerHTML = err;
}

function createElement(tag, content) {
	let el = document.createElement(tag);

	if (content)
		el.innerHTML = content;

	return el;
}

function displayRewards(title, rewards) {
	let numRewards = rewards.length;
	if (numRewards === 0) {
		spanURLNumber.innerHTML = `<b>No</b> rewards found.`;
		document.body.classList.add("empty");
		return;
	}

	rewardTitle = title;

	let fileWord = numRewards === 1 ? "reward" : "rewards";
	spanURLNumber.innerHTML = `<b>${numRewards}</b> ${fileWord} found.`;
	spanRewardTitle.innerHTML = `<b>Title:</b> ${rewardTitle}`;
	selRewards.size = Math.min(MAX_LIST_SIZE, Math.max(MIN_LIST_SIZE, numRewards));

	rewards.forEach(r => {
		let option = createElement("option", r.title);
		option.value = r.url;

		selRewards.add(option);
	});
}

window.onload = function() {
	let manifest = chrome.runtime.getManifest();
	prepareExt(manifest);

	try {
		chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
			let activeTab = tabs[0];
			if (!activeTab.url) {
				handleUnsupportedSite();
				return;
			}

			if (!/^https:\/\/my\.nintendo\.com\/rewards\/.+/gmi.test(activeTab.url)) {
				handleUnsupportedSite();
				return;
			}

			chrome.scripting
				.executeScript({
					target: { tabId: activeTab.id },
					files: ["script/script.js"],
				})
				.then(injectionResults => {
					if (!injectionResults) {
						handleError("Couldn't communicate with extension.");
						return;
					}

					let result = injectionResults[0];
					if (!result.result) {
						handleError("Couldn't communicate with script.");
						return;
					}

					if (result.result.error) {
						handleError(result.result.error);
						return;
					}

					displayRewards(result.result.title, result.result.rewards);
				},
				error => {
					handleError(error);
				});
		});
	} catch (exc) {
		handleError(exc.message);
	}
};