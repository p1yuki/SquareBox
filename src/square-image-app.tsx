import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, X, Palette, Image as ImageIcon } from 'lucide-react';
import Cropper from 'react-easy-crop';

// 型定義
interface ImageData {
  id: number;
  file: File;
  originalImage: HTMLImageElement;
  name: string;
  width: number;
  height: number;
}

interface BackgroundImageData {
  url: string;
  width: number;
  height: number;
}

const SquareImageApp: React.FC = () => {
  // 状態管理
  const [images, setImages] = useState<ImageData[]>([]); // アップロードされた画像の配列
  const [backgroundColor, setBackgroundColor] = useState<string>('#ffffff'); // 背景色
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false); // カラーパレットの表示/非表示
  const [backgroundType, setBackgroundType] = useState<'solid' | 'gradient' | 'image'>('solid');
  const [gradientColors, setGradientColors] = useState<[string, string]>(['#ffffff', '#f5ede5']); // グラデーションの色
  const [gradientDirection, setGradientDirection] = useState<string>('to right'); // グラデーションの方向
  const [backgroundImage, setBackgroundImage] = useState<BackgroundImageData | null>(null); // 背景画像
  const fileInputRef = useRef<HTMLInputElement | null>(null); // ファイル選択ボタンの参照
  const bgImageInputRef = useRef<HTMLInputElement | null>(null); // 背景画像選択ボタンの参照

  // PWAインストール用の状態
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState<boolean>(false);
  const [isInstalled, setIsInstalled] = useState<boolean>(false);

  // クロップ用
  const [cropModalOpen, setCropModalOpen] = useState<boolean>(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  useEffect(() => {
    // インストール済みかどうかを確認
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowInstall(false);
        setIsInstalled(true);
      }
    }
  };

  // パステルカラーの定義
  const pastelColors = [
    '#FFFFFF', '#e6b89c', '#b5c9c3', '#a5a58d', '#f5ede5', '#b7b7a4', '#d6ccc2', '#cdb4db', '#f2c6de', '#adc2a9', '#a3c4bc',
  ];

  // ドラッグアンドドロップのイベント処理
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  }, []);

  // ファイルアップロード処理
  const handleFileUpload = (files: File[]) => {
    const imageFiles = files.filter((file) => file.type.startsWith('image/'));
    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        const img = new window.Image();
        img.onload = () => {
          const newImage: ImageData = {
            id: Date.now() + Math.random(),
            file: file,
            originalImage: img,
            name: file.name,
            width: img.width,
            height: img.height,
          };
          setImages((prev) => [...prev, newImage]);
        };
        if (e.target && typeof e.target.result === 'string') {
          img.src = e.target.result;
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // ファイル選択ボタンのクリック処理
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileUpload(files);
  };

  // 背景画像のアップロード処理
  const handleBackgroundImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setCropImage(e.target?.result as string);
        setCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // クロップ完了時の処理
  const onCropComplete = useCallback((_: any, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // クロップ画像を背景としてセット
  const handleCropConfirm = async () => {
    if (!cropImage || !croppedAreaPixels) return;
    const image = new window.Image();
    image.src = cropImage;
    await new Promise((resolve) => { image.onload = resolve; });
    const canvas = document.createElement('canvas');
    const size = Math.max(croppedAreaPixels.width, croppedAreaPixels.height);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      size,
      size
    );
    const url = canvas.toDataURL();
    setBackgroundImage({ url, width: size, height: size });
    setCropModalOpen(false);
    setCropImage(null);
  };

  // プレビュー用の背景スタイルを生成
  const getPreviewBackgroundStyle = () => {
    if (backgroundType === 'gradient') {
      return {
        background: `linear-gradient(${gradientDirection}, ${gradientColors[0]}, ${gradientColors[1]})`,
      };
    } else if (backgroundType === 'image' && backgroundImage) {
      return {
        backgroundImage: `url(${backgroundImage.url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    } else {
      return { backgroundColor };
    }
  };

  // グラデーション方向の角度を計算
  const getGradientAngle = (direction: string) => {
    switch (direction) {
      case 'to right': return 0;
      case 'to bottom right': return 45;
      case 'to bottom': return 90;
      case 'to bottom left': return 135;
      case 'to left': return 180;
      case 'to top left': return 225;
      case 'to top': return 270;
      case 'to top right': return 315;
      default: return 0;
    }
  };

  // グラデーション方向を角度から設定
  const setGradientDirectionFromAngle = (angle: number) => {
    const directions = [
      { angle: 0, direction: 'to right' },
      { angle: 45, direction: 'to bottom right' },
      { angle: 90, direction: 'to bottom' },
      { angle: 135, direction: 'to bottom left' },
      { angle: 180, direction: 'to left' },
      { angle: 225, direction: 'to top left' },
      { angle: 270, direction: 'to top' },
      { angle: 315, direction: 'to top right' },
    ];
    const closest = directions.reduce((prev, curr) => {
      return Math.abs(curr.angle - angle) < Math.abs(prev.angle - angle) ? curr : prev;
    });
    setGradientDirection(closest.direction);
  };

  // 画像を正方形に変換してCanvasに描画
  const createSquareImage = (imageData: ImageData, bgColor: string) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    const size = Math.max(imageData.width, imageData.height);
    canvas.width = size;
    canvas.height = size;
    // 背景の描画
    if (backgroundType === 'gradient') {
      const gradient = ctx.createLinearGradient(
        gradientDirection.includes('right') ? 0 : size,
        gradientDirection.includes('bottom') ? 0 : size,
        gradientDirection.includes('right') ? size : 0,
        gradientDirection.includes('bottom') ? size : 0
      );
      gradient.addColorStop(0, gradientColors[0]);
      gradient.addColorStop(1, gradientColors[1]);
      ctx.fillStyle = gradient;
    } else if (backgroundType === 'image' && backgroundImage) {
      // 背景画像を描画
      ctx.drawImage(
        (() => {
          const img = new window.Image();
          img.src = backgroundImage.url;
          return img;
        })(),
        0, 0, backgroundImage.width, backgroundImage.height,
        0, 0, size, size
      );
    } else {
      ctx.fillStyle = bgColor;
    }
    ctx.fillRect(0, 0, size, size);
    // 画像を中央に配置するための計算
    const x = (size - imageData.width) / 2;
    const y = (size - imageData.height) / 2;
    ctx.drawImage(imageData.originalImage, x, y);
    return canvas;
  };

  // 単体画像のダウンロード
  const downloadImage = (imageData: ImageData) => {
    const canvas = createSquareImage(imageData, backgroundColor);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = imageData.name;
      const lastDotIndex = fileName.lastIndexOf('.');
      const nameWithoutExt = fileName.substring(0, lastDotIndex);
      const extension = fileName.substring(lastDotIndex);
      a.download = `${nameWithoutExt}_squared${extension}`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  // 一括ダウンロード機能
  const downloadAllImages = async () => {
    if (images.length === 0) return;
    const downloadPromises = images.map((imageData) => {
      return new Promise<void>((resolve) => {
        const canvas = createSquareImage(imageData, backgroundColor);
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve();
            return;
          }
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          const fileName = imageData.name;
          const lastDotIndex = fileName.lastIndexOf('.');
          const nameWithoutExt = fileName.substring(0, lastDotIndex);
          const extension = fileName.substring(lastDotIndex);
          a.download = `${nameWithoutExt}_squared${extension}`;
          a.click();
          URL.revokeObjectURL(url);
          resolve();
        }, 'image/png');
      });
    });
    await Promise.all(downloadPromises);
  };

  // 画像の削除
  const removeImage = (id: number) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* インストールボタンとガイド */}
        {!isInstalled && (
          <div className="mb-4 flex flex-col items-end">
            {showInstall && (
              <button
                onClick={handleInstallClick}
                className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition-colors mb-2"
              >
                SquareBoxをインストール
              </button>
            )}
            <div className="text-sm text-gray-600 bg-blue-50 rounded p-2">
              <span className="font-semibold">インストール方法：</span>
              {showInstall ? (
                <>上の「SquareBoxをインストール」ボタンを押してください。</>
              ) : (
                <>Chromeの右上「︙」メニューから「SquareBoxをインストール」を選択してください。</>
              )}
            </div>
          </div>
        )}
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            SquareBox
          </h1>
          <p className="text-gray-600">
            写真をクロップせずに背景を追加して正方形にします
          </p>
        </div>

        {/* アップロードエリア */}
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6 hover:border-blue-400 transition-colors"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <p className="text-lg text-gray-600 mb-2">
            画像をドラッグ＆ドロップまたはクリックして選択
          </p>
          <p className="text-sm text-gray-500">
            複数ファイル対応（PNG, JPG, GIF）
          </p>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* 背景色選択 */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-4">
            <h3 className="text-lg font-semibold text-gray-800">背景</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setBackgroundType('solid')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  backgroundType === 'solid' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                単色
              </button>
              <button
                onClick={() => setBackgroundType('gradient')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  backgroundType === 'gradient' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                グラデーション
              </button>
              <button
                onClick={() => setBackgroundType('image')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  backgroundType === 'image' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                画像
              </button>
            </div>
          </div>
          
          {backgroundType === 'solid' && (
            <>
              {/* パステルカラー選択 */}
              <div className="flex flex-wrap gap-2 mb-4">
                {pastelColors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setBackgroundColor(color)}
                    className={`w-10 h-10 rounded-full border-2 ${
                      backgroundColor === color ? 'border-blue-500' : 'border-gray-300'
                    } hover:scale-110 transition-transform`}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>

              {/* カスタムカラーピッカー */}
              <div className="mb-4">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="w-20 h-10 rounded border border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-600">
                  選択中: {backgroundColor}
                </span>
              </div>
            </>
          )}

          {backgroundType === 'gradient' && (
            <div className="space-y-4">
              <div className="flex gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">開始色</label>
                  <input
                    type="color"
                    value={gradientColors[0]}
                    onChange={(e) => setGradientColors([e.target.value, gradientColors[1]])}
                    className="w-20 h-10 rounded border border-gray-300"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">終了色</label>
                  <input
                    type="color"
                    value={gradientColors[1]}
                    onChange={(e) => setGradientColors([gradientColors[0], e.target.value])}
                    className="w-20 h-10 rounded border border-gray-300"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">方向</label>
                <select
                  value={gradientDirection}
                  onChange={(e) => setGradientDirection(e.target.value)}
                  className="px-3 py-1 rounded border border-gray-300"
                >
                  <option value="to right">左から右</option>
                  <option value="to left">右から左</option>
                  <option value="to bottom">上から下</option>
                  <option value="to top">下から上</option>
                  <option value="to bottom right">左上から右下</option>
                  <option value="to top left">右下から左上</option>
                </select>
              </div>
              <div 
                className="w-full h-20 rounded border border-gray-300"
                style={{
                  background: `linear-gradient(${gradientDirection}, ${gradientColors[0]}, ${gradientColors[1]})`
                }}
              />
            </div>
          )}

          {backgroundType === 'image' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => bgImageInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
                >
                  <ImageIcon className="h-4 w-4" />
                  背景画像を選択
                </button>
                {backgroundImage && (
                  <button
                    onClick={() => setBackgroundImage(null)}
                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                  >
                    画像を削除
                  </button>
                )}
                <input
                  ref={bgImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleBackgroundImageUpload}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </div>

        {/* 画像プレビューエリア */}
        {images.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                プレビュー ({images.length}枚)
              </h3>
              <button
                onClick={downloadAllImages}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
              >
                <Download className="h-4 w-4" />
                一括ダウンロード
              </button>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((imageData) => (
                <div key={imageData.id} className="relative group">
                  <div 
                    className="aspect-square overflow-hidden border border-gray-200 flex items-center justify-center"
                    style={getPreviewBackgroundStyle()}
                  >
                    <img
                      src={URL.createObjectURL(imageData.file)}
                      alt={imageData.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  
                  {/* 画像情報とボタン */}
                  <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <button
                        onClick={() => downloadImage(imageData)}
                        className="px-3 py-1 bg-blue-500 text-white rounded mb-2 hover:bg-blue-600 transition-colors"
                      >
                        <Download className="h-4 w-4 inline mr-1" />
                        DL
                      </button>
                      <button
                        onClick={() => removeImage(imageData.id)}
                        className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
                      >
                        <X className="h-4 w-4 inline mr-1" />
                        削除
                      </button>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 mt-1 truncate">
                    {imageData.name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* クロップ用モーダル */}
        {cropModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-white rounded-lg shadow-lg p-6 relative w-[90vw] max-w-2xl">
              <h2 className="text-lg font-semibold mb-4">背景画像の範囲を選択</h2>
              <div className="relative w-full h-96 bg-gray-200">
                <Cropper
                  image={cropImage!}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                  cropShape="rect"
                  showGrid={true}
                />
              </div>
              <div className="flex items-center gap-4 mt-4">
                <span className="text-sm">ズーム</span>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={e => setZoom(Number(e.target.value))}
                  className="w-40"
                />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={() => { setCropModalOpen(false); setCropImage(null); }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleCropConfirm}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  決定
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 使い方説明 */}
        <div className="bg-blue-50 rounded-lg p-4 mt-6">
          <h4 className="font-semibold text-blue-800 mb-2">使い方</h4>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. 上のエリアに画像をドラッグ＆ドロップするか、クリックして選択</li>
            <li>2. お好みの背景色を選択</li>
            <li>3. プレビューで確認して、個別または一括でダウンロード</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default SquareImageApp; 