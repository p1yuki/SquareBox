import html2canvas from 'html2canvas';
import { saveAs } from 'file-saver';
import Pica from 'pica';

// 必要な要素の取得
const uploadArea = document.getElementById('upload-area');
const fileInput = document.getElementById('file-input');
const previewArea = document.getElementById('preview-area');
const convertBtn = document.getElementById('convert-btn');
const downloadBtn = document.getElementById('download-btn');
const bgColorSelect = document.getElementById('bg-color');

// Picaインスタンスの作成
const pica = new Pica();

// ドラッグ＆ドロップのイベントハンドラ
uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('border-blue-500');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('border-blue-500');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('border-blue-500');
    handleFiles(e.dataTransfer.files);
});

// ファイル選択ボタンのイベントハンドラ
uploadArea.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
});

// ファイル処理関数
async function handleFiles(files) {
    previewArea.innerHTML = '';
    
    for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const container = document.createElement('div');
                container.className = 'preview-container';
                container.style.backgroundColor = bgColorSelect.value;
                
                const previewImg = document.createElement('img');
                previewImg.src = img.src;
                previewImg.className = 'preview-image';
                
                container.appendChild(previewImg);
                previewArea.appendChild(container);
            };
        };
        reader.readAsDataURL(file);
    }
}

// 変換ボタンのイベントハンドラ
convertBtn.addEventListener('click', async () => {
    const containers = document.querySelectorAll('.preview-container');
    
    for (const container of containers) {
        const img = container.querySelector('img');
        const canvas = document.createElement('canvas');
        const size = Math.max(img.naturalWidth, img.naturalHeight);
        
        canvas.width = size;
        canvas.height = size;
        
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = bgColorSelect.value;
        ctx.fillRect(0, 0, size, size);
        
        const x = (size - img.naturalWidth) / 2;
        const y = (size - img.naturalHeight) / 2;
        
        await pica.resize(img, canvas, {
            alpha: true,
            unsharpAmount: 80,
            unsharpRadius: 0.6,
            unsharpThreshold: 2
        });
        
        img.src = canvas.toDataURL();
    }
});

// ダウンロードボタンのイベントハンドラ
downloadBtn.addEventListener('click', async () => {
    const containers = document.querySelectorAll('.preview-container');
    const zip = new JSZip();
    
    for (let i = 0; i < containers.length; i++) {
        const container = containers[i];
        const canvas = await html2canvas(container);
        const blob = await new Promise(resolve => canvas.toBlob(resolve));
        zip.file(`image_${i + 1}.png`, blob);
    }
    
    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, 'instagram_photos.zip');
}); 