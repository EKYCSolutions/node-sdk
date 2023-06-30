<script lang="ts">
	import { EkycClientBrowser } from '@ekycsolutions/client/browser';
	import { MLVisionBrowser } from '@ekycsolutions/ml-vision/browser';
	import { createPublishableKey } from '@ekycsolutions/auth-browser';
	
	const ekycClient = new EkycClientBrowser({
		serverAddress: 'http://localhost:4000',
		auth: {
			apiKey: {
				api_key: '486fb5f9-3a1f-4d4c-831b-800cb2633020',
			},
		},
	});

	console.log(ekycClient);

	const mlVision = new MLVisionBrowser(ekycClient);

	ekycClient.getRequestOpts().then(console.log);

	createPublishableKey().then(k => {
		console.log(k.toSave());
		console.log(k.toDownloadJson({ appId: 'http://localhost:5173', keyId: 'abc' }));
	});
	
	let ocrImage: FileList;
	let faceImage: FileList;
	let blinkVideo: FileList;
	let turnLeftVideo: FileList;
	let turnRightVideo: FileList;

	const gogogo = () => {
		console.log({
			isRaw: true,
			objectType: 'NATIONAL_ID_0',
			ocrImage: ocrImage[0],
			faceImage: faceImage[0],
			sequences: [{
				checks: 'left',
				video: turnLeftVideo[0],
			}, {
				checks: 'right',
				video: turnRightVideo[0],
			}, {
				checks: 'blink',
				video: blinkVideo[0],
			}],
		});

		mlVision.manualKyc({
			isRaw: true,
			objectType: 'NATIONAL_ID_0',
			ocrImage: ocrImage[0],
			faceImage: faceImage[0],
			sequences: [{
				checks: 'left',
				video: turnLeftVideo[0],
			}, {
				checks: 'right',
				video: turnRightVideo[0],
			}, {
				checks: 'blink',
				video: blinkVideo[0],
			}],
		});
	};
</script>

<svelte:head>
	<title>Home</title>
	<meta name="description" content="Svelte demo app" />
</svelte:head>

<section>
	<p>ocr image</p>
	<input
		type="file"
		bind:files={ocrImage}
	/>

	<p>face image</p>
	<input
		type="file"
		bind:files={faceImage}
	/>

	<p>sequences</p>
	<p>left</p>
	<input
		type="file"
		bind:files={turnLeftVideo}
	/>

	<p>right</p>
	<input
		type="file"
		bind:files={turnRightVideo}
	/>

	<p>blink</p>
	<input
		type="file"
		bind:files={blinkVideo}
	/>

	<button on:click={gogogo}>
		leeeee siiii goooooo
	</button>
</section>

<style>
</style>
