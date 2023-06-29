<script lang="ts">
	import { EkycClientBrowser } from '@ekycsolutions/client/browser';
	import { MLVisionBrowser } from '@ekycsolutions/ml-vision/browser';
	import { createPublishableKey } from '@ekycsolutions/auth-browser';
	
	const ekycClient = new EkycClientBrowser({
		serverAddress: 'http://localhost:4000',
		auth: {
			apiKey: {
				key_id: '0b3509bb-07e9-4858-956e-0cd07d090bab',
				app_id: 'http://localhost:5173',
				client_key: 'ngwDXADnSBxuWcIiRBSQRPDnAjUZR1DRg_5_HnUiIoFKLCTwBLlQK-WDLocro_Y64uRNYwNhcOj_uLfSuVNR2CLcspdh5khpFn_KfpLgvvY9miNU5vIx35MrU-yjYEC2RVkZ6Jp9AhLln2WTich151E0li8pbFwnyOlbsF0pI7idrFAVM3wiTa4SvopSi38ZvRd6PwakrGV5PSrM-QoWSF3xx6GRx0vVDNrjse1sKgXb5gNHghRQE94AxiZDqynx',
				client_pkey: 'PnEVT1eyaFq6nXG2ZhT9JvAaserEsbl7HwUkpduk4fo=',
			},
		},
	});

	const mlVision = new MLVisionBrowser(ekycClient);

	createPublishableKey().then(console.log);
	
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
