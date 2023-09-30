"use strict";

function debugList(arr) {
	arr.forEach(i => console.error);
}

function getRewardName() {
	let titleElement = document.querySelector("h1.RewardHeader_title div.label");
	if (!titleElement)
		return null;

	let title = titleElement.innerText;

	// replace a bunch of chars windows can't handle with safer chars
	title = title.replaceAll("/", " - ");
	title = title.replaceAll("\\", " - ");
	title = title.replaceAll(":", " - ");
	title = title.replaceAll("<", "(");
	title = title.replaceAll(">", ")");
	title = title.replaceAll("\"", "'");
	title = title.replaceAll("?", "_");

	// remove double spaces
	title = title.replaceAll(/ +/gi, " ");

	// trim "Wallpaper - " from the beginning of the string
	title = title.replace(/^Wallpaper - /gi, "");

	return title;
}

// returns array of {title: "", url: ""} objects
function getRewardLinks() {
	let downloadLinks = document.querySelectorAll("div.RewardResult_body div.ResultMedia_link a");

	if (downloadLinks.length === 0) {
		let redeemButton = document.querySelector("button.btn.btn-primary.btn-large.btn-block.RewardAction_get");
		if (!redeemButton) {
			throw new Error("This does not appear to be a wallpaper-type reward.");
		}

		throw new Error("You have yet to redeem this reward!");
	}

	let returnLinks = Array.from(downloadLinks).map(a => {
		return {
			title: a.innerText,
			url: a.href
		};
	});

	debugList(returnLinks);
	return returnLinks;
}

function returnValue() {
	let rewards = [];
	let error = null;

	try {
		rewards = getRewardLinks();
	} catch(err) {
		if (err instanceof Error)
			error = err.message;
		else
			error = err;
	}

	return {
		title: getRewardName(),
		rewards: rewards,
		error: error
	};
}

returnValue();