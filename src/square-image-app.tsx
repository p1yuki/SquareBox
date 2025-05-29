import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Download, X, Palette } from 'lucide-react';

const SquareImageApp = () => {
  // 状態管理（データの保存場所）
  const [images, setImages] = useState([]); // アップロードされた画像の配列
  const [backgroundColor, setBackgroundColor] = useState('#ffffff'); // 背景色
  const [showColorPicker, setShowColorPicker] = useState(false); // カラーパレットの表示/非表示
  const fileInputRef = useRef(null); // ファイル選択ボタンの参照

  // PWAインストール用の状態
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstall, setShowInstall] = useState(false);

  useEffect(() => {
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
      }
    }
  };

  // パステルカラーの定義（エモい色）
  const pastelColors = [
    '#e6b89c', // くすみオレンジ
    '#b5c9c3', // くすみグリーン
    '#a5a58d', // オリーブグレー
    '#f5ede5', // 生成り
    '#b7b7a4', // グレージュ
    '#d6ccc2', // 淡いベージュ
    '#cdb4db', // くすみパープル
    '#f2c6de', // くすみピンク
    '#adc2a9', // 淡いグリーン
    '#a3c4bc', // くすみブルー
  ];

  // ドラッグアンドドロップのイベント処理
  const handleDragOver = useCallback((e) => {
    e.preventDefault(); // ブラウザのデフォルト動作を無効化
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  }, []);

  // ファイルアップロード処理
  const handleFileUpload = (files) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    imageFiles.forEach((file) => {
      const reader = new FileReader(); // ファイルを読み込むためのAPI
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // 新しい画像オブジェクトを作成
          const newImage = {
            id: Date.now() + Math.random(), // 一意のID
            file: file,
            originalImage: img,
            name: file.name,
            width: img.width,
            height: img.height
          };
          
          // 既存の画像リストに追加
          setImages(prev => [...prev, newImage]);
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file); // ファイルをデータURL形式で読み込み
    });
  };

  // ファイル選択ボタンのクリック処理
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFileUpload(files);
  };

  // 画像を正方形に変換してCanvasに描画
  const createSquareImage = (imageData, bgColor) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // 正方形のサイズを決定（縦横の大きい方に合わせる）
    const size = Math.max(imageData.width, imageData.height);
    canvas.width = size;
    canvas.height = size;
    
    // 背景色で塗りつぶし
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, size, size);
    
    // 画像を中央に配置するための計算
    const x = (size - imageData.width) / 2;
    const y = (size - imageData.height) / 2;
    
    // 画像を描画
    ctx.drawImage(imageData.originalImage, x, y);
    
    return canvas;
  };

  // 単体画像のダウンロード
  const downloadImage = (imageData) => {
    const canvas = createSquareImage(imageData, backgroundColor);
    
    // CanvasをBlob形式に変換してダウンロード
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `square_${imageData.name}`;
      a.click();
      URL.revokeObjectURL(url); // メモリリークを防ぐためにURLを解放
    }, 'image/png');
  };

  // 一括ダウンロード機能
  const downloadAllImages = async () => {
    if (images.length === 0) return;
    for (let i = 0; i < images.length; i++) {
      const imageData = images[i];
      const canvas = createSquareImage(imageData, backgroundColor);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `square_${String(i + 1).padStart(3, '0')}_${imageData.name}`;
        a.click();
        URL.revokeObjectURL(url);
      }, 'image/png');
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  // 画像の削除
  const removeImage = (id) => {
    setImages(prev => prev.filter(img => img.id !== id));
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* インストールボタンとガイド */}
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
            <h3 className="text-lg font-semibold text-gray-800">背景色</h3>
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              <Palette className="h-4 w-4" />
              カスタムカラー
            </button>
          </div>
          
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
          {showColorPicker && (
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
                    className="aspect-square rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center"
                    style={{ backgroundColor }}
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