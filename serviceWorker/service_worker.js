importScripts('./lib.js');

const urls = [
	'https://www.youtube.com/watch*',
	'https://live.nicovideo.jp/watch*',
	'https://www.twitch.tv/*',
	'https://www.showroom-live.com/*',
	'https://www.openrec.tv/live*',
	'https://www.mildom.com/*',
	'https://twitcasting.tv/*',
	'https://0000.studio/*'
];
//チャンネル選択ウィンドウの初期状態
const windowOption = {
	focused: true,
	top: 32,
	left: 32,
	type: 'panel',
	height: 200,
	width: 500,
	url: './selectChannel/selectChannel.html'
};

let windowID = -1;

(function windowCreate() {
	chrome.commands.onCommand.addListener((command) => {
		if (command === 'EasyLiveChat') {
			//開かれているウィンドウを取得
			chrome.windows.get(windowID, function(window) {
				if (!chrome.runtime.lastError && window) {
					//すでに開かれていればフォーカス
					chrome.windows.update(windowID, {focused: true});
				} else {
					//開かれていなければ作成
					chrome.windows.create(windowOption, function(window) {
						//ウィンドウを使いまわしするためにID保持
						windowID = window.id;
					});
				};
			});
		};
	});
})();

(function requestStreamDetail() {
	chrome.runtime.onConnect.addListener(function(port) {
		port.onMessage.addListener(function(message) {
			if (message.type === 'getStreamDetail') {
				getStreamDetail().then(function(contentArray) {
					console.log(contentArray);  //debug
					let contentJSON = JSON.stringify(contentArray);
					port.postMessage({contentArray: contentJSON});
				});
			};
		});
	});
})();

function getStreamDetail() {
	return new Promise(resolve => {
		chrome.tabs.query({url: urls}, function(tabs) {
			let index = 0;
			let contentArray = [];
			tabs.forEach(function(tab){
				console.log('tab  ' + tab.url);    //debug
				let toGetterPort = chrome.tabs.connect(tab.id);
				toGetterPort.postMessage({getStreamDetail: 'ELCget'});
		
				toGetterPort.onMessage.addListener(function(response) {
					console.log('response  ' + response.getter_streamURL);  //debug
					if (response.getter_chatOK === true) {
						contentArray.push({
							platform: response.getter_platform,
							streamTitle: response.getter_streamTitle,
							streamURL: response.getter_streamURL
						});
					};
					index++
					if (index === tabs.length) {
						console.log('search success');  //debug
						resolve(contentArray);
					};
				});
			});
		});
	});
};