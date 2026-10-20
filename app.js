const $ = (id) => document.getElementById(id);

const scriptEl = $("script");
const voiceEl = $("voice");
const ratioEl = $("ratio");
const mediaEl = $("media");
const audioEl = $("audio");
const subtitlesEl = $("subtitles");
const preview = $("preview");
const imagePreview = $("imagePreview");
const videoPreview = $("videoPreview");
const placeholder = $("placeholder");
const caption = $("caption");
const statusEl = $("status");
const progressBar = $("progressBar");
const buildBtn = $("build");
const downloadLink = $("download");

let mediaUrl = null;
let audioUrl = null;
let lastOutputUrl = null;
let chosenMediaType = null;

function setStatus(message, progress = 0) {
  statusEl.textContent = message;
  progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
}

function resetDownload() {
  if (lastOutputUrl) URL.revokeObjectURL(lastOutputUrl);
  lastOutputUrl = null;
  downloadLink.removeAttribute("href");
  downloadLink.classList.add("disabled");
  downloadLink.setAttribute("aria-disabled", "true");
}

function setDownload(blob, extension) {
  resetDownload();
  lastOutputUrl = URL.createObjectURL(blob);
  downloadLink.href = lastOutputUrl;
  downloadLink.download = `ai-video-studio.${extension}`;
  downloadLink.classList.remove("disabled");
  downloadLink.setAttribute("aria-disabled", "false");
  downloadLink.textContent = `Tải video .${extension.toUpperCase()}`;
}

function updateRatio() {
  preview.classList.remove("ratio-16-9", "ratio-9-16", "ratio-1-1");
  const ratio = ratioEl.value;
  preview.classList.add(ratio === "9:16" ? "ratio-9-16" : ratio === "1:1" ? "ratio-1-1" : "ratio-16-9");
  $("ratioLabel").textContent = ratio;
}
ratioEl.addEventListener("change", updateRatio);

function updateCaption(text = scriptEl.value) {
  caption.textContent = text.trim();
  caption.hidden = !subtitlesEl.checked || !text.trim();
}
scriptEl.addEventListener("input", () => updateCaption());
subtitlesEl.addEventListener("change", () => updateCaption());

mediaEl.addEventListener("change", () => {
  const file = mediaEl.files?.[0];
  if (!file) return;
  if (mediaUrl) URL.revokeObjectURL(mediaUrl);
  mediaUrl = URL.createObjectURL(file);
  chosenMediaType = file.type.startsWith("video/") ? "video" : file.type.startsWith("image/") ? "image" : null;
  imagePreview.hidden = true;
  videoPreview.hidden = true;
  placeholder.hidden = true;

  if (chosenMediaType === "image") {
    imagePreview.src = mediaUrl;
    imagePreview.hidden = false;
  } else if (chosenMediaType === "video") {
    videoPreview.src = mediaUrl;
    videoPreview.muted = true;
    videoPreview.loop = true;
    videoPreview.hidden = false;
    videoPreview.play().catch(() => {});
  } else {
    placeholder.hidden = false;
    setStatus("Định dạng media chưa được hỗ trợ.");
    return;
  }
  updateCaption();
  setStatus(`Đã tải ${file.name}.`, 5);
  resetDownload();
});

audioEl.addEventListener("change", () => {
  const file = audioEl.files?.[0];
  if (!file) return;
  if (audioUrl) URL.revokeObjectURL(audioUrl);
  audioUrl = URL.createObjectURL(file);
  setStatus(`Đã tải giọng đọc: ${file.name}.`, 5);
  resetDownload();
});

function getSpeechVoice() {
  if (!("speechSynthesis" in window)) return null;
  const lang = voiceEl.value.toLowerCase();
  const voices = speechSynthesis.getVoices();
  return voices.find(v => v.lang.toLowerCase() === lang)
      || voices.find(v => v.lang.toLowerCase().startsWith(lang.split("-")[0]))
      || null;
}

$("previewVoice").addEventListener("click", () => {
  const text = scriptEl.value.trim();
  if (!text) {
    setStatus("Hãy nhập kịch bản trước.");
    return;
  }
  if (audioUrl) {
    const audio = new Audio(audioUrl);
    audio.play().catch(() => setStatus("Không phát được âm thanh. Hãy kiểm tra định dạng tệp."));
    return;
  }
  if (!("speechSynthesis" in window)) {
    setStatus("Trình duyệt này không hỗ trợ giọng đọc. Hãy tải lên tệp âm thanh có sẵn.");
    return;
  }
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = voiceEl.value;
  const selected = getSpeechVoice();
  if (selected) utterance.voice = selected;
  utterance.onstart = () => setStatus("Đang phát giọng đọc xem thử...");
  utterance.onend = () => setStatus("Nghe thử hoàn tất.");
  utterance.onerror = () => setStatus("Không phát được giọng đọc trên trình duyệt này.");
  speechSynthesis.speak(utterance);
});

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function loadVideo(url) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.onloadedmetadata = () => resolve(video);
    video.onerror = reject;
    video.load();
  });
}

function canvasDimensions(ratio) {
  if (ratio === "9:16") return [720, 1280];
  if (ratio === "1:1") return [720, 720];
  return [1280, 720];
}

function drawCover(ctx, source, sw, sh, width, height) {
  const scale = Math.max(width / sw, height / sh);
  const dw = sw * scale;
  const dh = sh * scale;
  ctx.drawImage(source, (width - dw) / 2, (height - dh) / 2, dw, dh);
}

function drawSubtitle(ctx, text, width, height) {
  if (!subtitlesEl.checked || !text.trim()) return;
  const maxWidth = width * 0.86;
  const fontSize = Math.max(22, Math.round(width / 38));
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const words = text.trim().split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);

  const lineHeight = fontSize * 1.25;
  const shownLines = lines.slice(-3);
  const blockHeight = shownLines.length * lineHeight + 28;
  const y = height - height * 0.07 - blockHeight;
  ctx.fillStyle = "rgba(0,0,0,.72)";
  const boxWidth = Math.min(maxWidth + 28, Math.max(...shownLines.map(l => ctx.measureText(l).width)) + 28);
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect((width - boxWidth) / 2, y, boxWidth, blockHeight, 12);
  else ctx.rect((width - boxWidth) / 2, y, boxWidth, blockHeight);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  shownLines.forEach((l, i) => ctx.fillText(l, width / 2, y + 14 + lineHeight * (i + 0.5), maxWidth));
}

async function createSpeechAudio(text, lang) {
  // SpeechSynthesis can play speech, but browsers do not expose its generated audio
  // as a downloadable audio file. For export, require a user-provided audio file.
  throw new Error("Để xuất video có tiếng, hãy tải lên tệp giọng đọc. Giọng đọc trình duyệt chỉ dùng để nghe thử và không thể thu trực tiếp ổn định vào video.");
}

async function buildVideo() {
  resetDownload();
  const mediaFile = mediaEl.files?.[0];
  const audioFile = audioEl.files?.[0];

  if (!mediaFile) {
    setStatus("Hãy tải lên một ảnh hoặc clip trước.");
    return;
  }
  if (!audioFile) {
    setStatus("Hãy tải lên tệp giọng đọc để ghép vào video. Nút nghe thử dùng giọng đọc trình duyệt nhưng không xuất trực tiếp thành tệp âm thanh.");
    return;
  }
  if (!window.MediaRecorder || !HTMLCanvasElement.prototype.captureStream) {
    setStatus("Trình duyệt chưa hỗ trợ ghi video canvas. Hãy thử phiên bản Chrome hoặc Edge mới.");
    return;
  }

  buildBtn.disabled = true;
  $("previewVoice").disabled = true;
  try {
    setStatus("Đang đọc media...", 10);
    const [width, height] = canvasDimensions(ratioEl.value);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { alpha: false });
    let stillImage = null;
    let sourceVideo = null;
    if (mediaFile.type.startsWith("image/")) stillImage = await loadImage(mediaUrl);
    else sourceVideo = await loadVideo(mediaUrl);

    const audio = new Audio(audioUrl);
    audio.preload = "auto";
    await new Promise((resolve, reject) => {
      audio.onloadedmetadata = resolve;
      audio.onerror = () => reject(new Error("Không đọc được tệp âm thanh."));
      audio.load();
    });
    if (!Number.isFinite(audio.duration) || audio.duration <= 0) {
      throw new Error("Không xác định được thời lượng âm thanh.");
    }

    const stream = canvas.captureStream(30);
    let audioContext = null;
    let sourceNode = null;
    let destination = null;
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      await audioContext.resume();
      sourceNode = audioContext.createMediaElementSource(audio);
      destination = audioContext.createMediaStreamDestination();
      sourceNode.connect(destination);
      sourceNode.connect(audioContext.destination);
      destination.stream.getAudioTracks().forEach(track => stream.addTrack(track));
    } catch (e) {
      throw new Error("Không thể kết nối âm thanh trong trình duyệt này. Hãy thử Chrome hoặc Edge mới.");
    }

    let mimeType = "";
    const candidates = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/webm"];
    mimeType = candidates.find(type => MediaRecorder.isTypeSupported(type)) || "";
    if (!mimeType) throw new Error("Trình duyệt không có bộ mã hóa WebM được hỗ trợ.");

    const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks = [];
    recorder.ondataavailable = event => { if (event.data?.size) chunks.push(event.data); };
    const finished = new Promise((resolve, reject) => {
      recorder.onstop = () => resolve(new Blob(chunks, { type: recorder.mimeType || "video/webm" }));
      recorder.onerror = () => reject(new Error("Lỗi khi ghi video."));
    });

    const drawFrame = () => {
      if (stillImage) {
        drawCover(ctx, stillImage, stillImage.naturalWidth, stillImage.naturalHeight, width, height);
      } else if (sourceVideo && sourceVideo.readyState >= 2) {
        drawCover(ctx, sourceVideo, sourceVideo.videoWidth, sourceVideo.videoHeight, width, height);
      } else {
        ctx.fillStyle = "#111a2e";
        ctx.fillRect(0, 0, width, height);
      }
      drawSubtitle(ctx, scriptEl.value, width, height);
    };

    if (sourceVideo) await sourceVideo.play().catch(() => {});
    drawFrame();
    const interval = setInterval(drawFrame, 1000 / 30);
    recorder.start(250);
    setStatus("Đang dựng và ghi video...", 25);
    audio.currentTime = 0;
    await audio.play();
    const startedAt = performance.now();
    const durationMs = audio.duration * 1000;

    await new Promise(resolve => {
      const tick = () => {
        const progress = Math.min(95, 25 + ((performance.now() - startedAt) / durationMs) * 70);
        setStatus(`Đang dựng video... ${Math.round(progress)}%`, progress);
        if (audio.ended || audio.paused) resolve();
        else requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });

    clearInterval(interval);
    if (sourceVideo) sourceVideo.pause();
    recorder.stop();
    const blob = await finished;
    stream.getTracks().forEach(track => track.stop());
    if (audioContext) await audioContext.close();
    setDownload(blob, "webm");
    setStatus("Hoàn tất! Video WebM đã sẵn sàng tải xuống.", 100);
  } catch (error) {
    console.error(error);
    setStatus(error.message || "Đã xảy ra lỗi khi dựng video.");
  } finally {
    buildBtn.disabled = false;
    $("previewVoice").disabled = false;
  }
}

buildBtn.addEventListener("click", buildVideo);
updateRatio();
updateCaption();
if ("speechSynthesis" in window) speechSynthesis.onvoiceschanged = () => {};
