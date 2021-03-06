// Hack, need to actually use bundler, right now these rely on global (non-module) files

class PipDemoLoader {
	renderer: PipRenderer;
	constructor(renderer?: PipRenderer) {
		this.renderer =
			renderer ||
			new PipRenderer({
				startOpen: false
			});
	}

	private clearCanvas(canvas: HTMLCanvasElement) {
		const ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	private async svgStrToImage(svgStr: string) {
		const img = document.createElement('img');
		let resolver: () => void;
		const promise = new Promise((res) => {
			resolver = res;
		});
		img.onload = resolver;
		img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;
		img.style.display = 'none';
		await promise;
		return img;
	}

	private getRandomInt(min: number, max: number) {
		min = Math.ceil(min);
		max = Math.floor(max);
		return Math.floor(Math.random() * (max - min)) + min;
	}

	private loadImg(img: HTMLImageElement) {
		return new Promise((resolve) => {
			if (img.complete) {
				resolve();
			} else {
				img.addEventListener('load', resolve);
			}
		});
	}

	public static b64toBlob = (base64Str: string, type = 'application/octet-stream') => fetch(`data:${type};base64,${base64Str}`).then((res) => res.blob());

	public async loadToggl(canvas?: HTMLCanvasElement) {
		const RENDER_MS = 400;
		const getLogo = (isRunning: boolean) => {
			const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" class="css-1efho7e"><defs/><g fill="none"><circle cx="11" cy="11" r="8.13" fill="#${isRunning ? 'fff' : '422A4C'}"/><path fill="#${isRunning ? 'dd6fd1' : 'FCE5D8'}" d="M11 16.77a5.4 5.4 0 01-5.35-5.43A5.3 5.3 0 019.6 6.21V7.8a3.74 3.74 0 00-2.48 3.55c0 2.17 1.69 3.95 3.87 3.95s3.96-1.78 3.96-3.95A3.88 3.88 0 0012.5 7.8V6.21a5.3 5.3 0 013.96 5.13A5.49 5.49 0 0111 16.77zm-.8-12.33h1.6v7.6h-1.6v-7.6zM11 .1C4.96.1 0 5.03 0 11.14 0 17.16 4.96 22.1 11 22.1c6.14 0 11-4.93 11-10.95C22 5.03 17.14.1 11 .1z"/></g></svg>`;
			return this.svgStrToImage(svgStr);
		};
		const logoOn = await getLogo(true);
		const logoOff = await getLogo(false);
		const background = await this.svgStrToImage(`<svg version="1.1" width="440" height="80" viewBox="0.0 0.0 440.0 80.0" fill="none" stroke="none" stroke-linecap="square" stroke-miterlimit="10" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg"><clipPath id="p.0"><path d="m0 0l440.0 0l0 80.0l-440.0 0l0 -80.0z" clip-rule="nonzero"/></clipPath><g clip-path="url(#p.0)"><path fill="#000000" fill-opacity="0.0" d="m0 0l440.0 0l0 80.0l-440.0 0z" fill-rule="evenodd"/><path fill="#2c1338" d="m0 0l440.0 0l0 80.031494l-440.0 0z" fill-rule="evenodd"/><path fill="#422a4c" d="m59.792652 20.934574l0 0c0 -5.2649307 4.26807 -9.532999 9.533001 -9.532999l237.62692 0c2.5282898 0 4.953064 1.0043659 6.7408447 2.7921505c1.7877808 1.7877846 2.7921448 4.2125397 2.7921448 6.7408485l0 38.13085c0 5.264927 -4.2680664 9.533001 -9.5329895 9.533001l-237.62692 0c-5.2649307 0 -9.533001 -4.268074 -9.533001 -9.533001z" fill-rule="evenodd"/><path fill="#fce5d8" d="m327.5013 22.397026l0 0c0 -4.8619423 3.9413757 -8.803326 8.803314 -8.803326l85.3855 0c2.3347778 0 4.573944 0.9274912 6.224884 2.578434c1.65094 1.6509438 2.5784302 3.8901043 2.5784302 6.2248917l0 35.212246c0 4.8619423 -3.9413757 8.803326 -8.803314 8.803326l-85.3855 0c-4.8619385 0 -8.803314 -3.9413834 -8.803314 -8.803326z" fill-rule="evenodd"/></g></svg>`);
		// Create canvas with exact size
		canvas = canvas || document.createElement('canvas');
		canvas.style.display = 'block';
		canvas.width = 440;
		canvas.height = 80;
		const ctx = canvas.getContext('2d');
		// @ts-ignore
		window.ctx = ctx;

		this.renderer.streamCanvas(canvas);

		interface TimerInfo {
			isRunning: boolean;
			entryDescription: string;
			projectDescription?: string;
			timeFormatted: string;
		}

		const getTimerInfo = () => {
			const info: TimerInfo = {
				isRunning: false,
				entryDescription: '{Inactive}',
				projectDescription: '',
				timeFormatted: '0:00:00'
			};

			if (!document.querySelector('div[title*="Start time entry"]') && document.location.origin === 'https://track.toggl.com') {
				info.isRunning = true;
				const projectSpan: HTMLSpanElement | null = document.querySelector('span[title*="Select project"] span[color="#8b50bf"]');
				info.projectDescription = projectSpan ? projectSpan.innerText : '';
				const entryDiv: HTMLDivElement | null = document.querySelector('div[tabindex][data-placeholder]');
				info.entryDescription = entryDiv ? entryDiv.innerText : info.entryDescription;
				const durationDiv: HTMLDivElement | null = document.querySelector('div[title="Add duration"]');
				info.timeFormatted = durationDiv ? durationDiv.innerText : info.timeFormatted;
			}

			return info;
		};

		const renderFrame = async (info?: TimerInfo) => {
			const timerInfo = info || getTimerInfo();
			this.clearCanvas(canvas);
			ctx.fillStyle = 'white';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			ctx.drawImage(background, 0, 0, canvas.width, canvas.height);
			// Entry Title
			ctx.fillStyle = 'white';
			ctx.font = 'normal 21px sans-serif';
			ctx.fillText(timerInfo.entryDescription, 68, 48);
			// Entry time
			ctx.fillStyle = 'black';
			ctx.fillText(timerInfo.timeFormatted, 346, 46);
			// Logo
			if (timerInfo.isRunning) {
				ctx.drawImage(logoOn, 12, 20, 36, 36);
			} else {
				ctx.drawImage(logoOff, 12, 20, 36, 36);
			}
		};

		let timer = setInterval(renderFrame, RENDER_MS);
		renderFrame();

		return {
			exitDemo() {
				clearInterval(timer);
			},
			/**
			 * You can override the info source for the running timer, for example to mock
			 * @param infoFunc Func that will be called to get timer info for new frame
			 * @param intervalMs Time between updates
			 */
			overrideInfoSource(infoFunc: () => TimerInfo, intervalMs = 50) {
				clearInterval(timer);
				timer = setInterval(() => {
					const info = infoFunc();
					renderFrame(info);
				}, intervalMs);
			}
		};
	}

	public async loadStats(bgImage: HTMLImageElement, graphTile: HTMLImageElement, canvas?: HTMLCanvasElement) {
		const RENDER_MS = Math.floor(1000 / 20);
		await this.loadImg(bgImage);
		await this.loadImg(graphTile);

		// Some local state
		const maxVisitors = 20;
		const pulseAnimationMs = 1000;
		const pulseCyclePeak = Math.floor(1.4 * (pulseAnimationMs / RENDER_MS));
		let currPulseCycle = 0;
		let pulseCycleDirection: 'up' | 'down' = 'up';
		const stats = {
			realTimeVisitors: this.getRandomInt(0, maxVisitors)
		};
		const graphTileInfo = {
			splitXLoc: 0,
			tileWidth: 538,
			tileHeight: 197,
			fillWidth: 140,
			fillHeight: 108,
			fillDx: 105,
			fillDy: 56
		};

		// Create canvas with exact size
		canvas = canvas || document.createElement('canvas');
		canvas.style.display = 'block';
		canvas.width = 440;
		canvas.height = 146;
		const ctx = canvas.getContext('2d');

		this.renderer.streamCanvas(canvas);

		const easeInOut = (x: number) => {
			return -(Math.cos(Math.PI * x) - 1) / 2;
		};

		const renderFrame = async () => {
			// Draw background
			this.clearCanvas(canvas);
			ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
			if (currPulseCycle === pulseCyclePeak) {
				pulseCycleDirection = 'down';
			} else if (currPulseCycle === 0) {
				pulseCycleDirection = 'up';
			}
			currPulseCycle = pulseCycleDirection === 'up' ? ++currPulseCycle : --currPulseCycle;

			// Draw pulsing "real-time" indicator dot
			const radius = 8;
			const blurPxMax = Math.floor(radius * 0.4);
			ctx.fillStyle = 'white';
			ctx.beginPath();
			const dotDx = 417;
			const dotDy = 120;
			ctx.ellipse(dotDx, dotDy, radius, radius, 0, 0, 2 * Math.PI);
			ctx.fill();
			const alpha = easeInOut(currPulseCycle / pulseCyclePeak);
			const blurPx = parseFloat((alpha * blurPxMax).toFixed(2));
			ctx.fillStyle = `rgba(255, 255, 255, ${alpha.toFixed(2)})`;
			ctx.ellipse(dotDx, dotDy, radius + blurPx, radius + blurPx, 0, 0, 2 * Math.PI);
			ctx.fill();

			// Add real-time visitor count
			ctx.fillStyle = 'white';
			ctx.font = 'normal 21px arial';
			ctx.fillText(`Visitors: ${stats.realTimeVisitors}`, 296, 100);

			// Add moving graph
			// Graph is repeatable on x-axis
			const scrollDirection: 'ltr' | 'rtl' = 'rtl';
			const xLoc = graphTileInfo.splitXLoc;
			const { fillWidth, tileHeight, tileWidth, fillDx, fillDy } = graphTileInfo;
			// @ts-ignore
			if (scrollDirection === 'ltr') {
				graphTileInfo.splitXLoc = xLoc === fillWidth ? 0 : xLoc + 1;
			} else {
				graphTileInfo.splitXLoc = xLoc === 0 ? fillWidth : xLoc - 1;
			}
			const y = 0 + fillDy;
			const h = graphTileInfo.fillHeight;
			const dxAlpha = 0 + fillDx;
			// Clip width,
			const sWidthAlpha = Math.round((tileWidth * xLoc) / fillWidth);
			// Clip from right side
			const sxAlpha = tileWidth - sWidthAlpha;
			const dWidthAlpha = xLoc;
			if (sWidthAlpha) {
				ctx.drawImage(graphTile, sxAlpha, y, sWidthAlpha, tileHeight, dxAlpha, y, dWidthAlpha, h);
			}
			if (xLoc < fillWidth) {
				const sxBeta = 0;
				const sWidthBeta = Math.round((tileWidth * (fillWidth - xLoc)) / fillWidth);
				const dxBeta = xLoc + fillDx;
				const dWidthBeta = fillWidth - xLoc;
				if (dWidthBeta) {
					ctx.drawImage(graphTile, sxBeta, y, sWidthBeta, tileHeight, dxBeta, y, dWidthBeta, h);
				}
			}
		};

		const updateStats = async () => {
			stats.realTimeVisitors = this.getRandomInt(0, maxVisitors);
		};

		let statsTimer = setInterval(updateStats, 2000);
		let renderTimer = setInterval(renderFrame, RENDER_MS);
		updateStats();
		renderFrame();

		return {
			exitDemo() {
				clearInterval(statsTimer);
				clearInterval(renderTimer);
			}
		};
	}
}
