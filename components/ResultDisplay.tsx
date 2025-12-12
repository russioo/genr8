'use client';

import { Download, Share2 } from 'lucide-react';
import Image from 'next/image';
import JSZip from 'jszip';

interface ResultDisplayProps {
  type: 'image' | 'video';
  url: string;
  urls?: string[];
  prompt: string;
  modelName: string;
  onShare: () => void;
}

export default function ResultDisplay({
  type,
  url,
  urls,
  prompt,
  modelName,
  onShare,
}: ResultDisplayProps) {
  const handleDownload = async (imageUrl?: string, index?: number) => {
    const downloadUrl = imageUrl || url;
    const timestamp = Date.now();
    const fileName = index !== undefined 
      ? `genr8-image-${index + 1}-${timestamp}.png`
      : `genr8-${type}-${timestamp}.${type === 'image' ? 'png' : 'mp4'}`;

    try {
      const response = await fetch(downloadUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleDownloadAll = async () => {
    try {
      const zip = new JSZip();
      const timestamp = Date.now();
      
      for (let i = 0; i < displayUrls.length; i++) {
        try {
          const response = await fetch(displayUrls[i]);
          const blob = await response.blob();
          const extension = displayUrls[i].split('.').pop()?.split('?')[0] || 'png';
          zip.file(`image-${i + 1}.${extension}`, blob);
        } catch (error) {
          console.error(`Failed to add image ${i + 1}:`, error);
        }
      }
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = window.URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = zipUrl;
      link.download = `genr8-images-${timestamp}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(zipUrl);
    } catch (error) {
      for (let i = 0; i < displayUrls.length; i++) {
        await handleDownload(displayUrls[i], i);
        if (i < displayUrls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
    }
  };

  const displayUrls = urls && urls.length > 0 ? urls : [url];
  const hasMultipleImages = displayUrls.length > 1 && type === 'image';

  return (
    <div className="space-y-4">
      {/* Preview */}
      {hasMultipleImages ? (
        <div>
          <div className="text-[#666] text-xs mb-2">{displayUrls.length} variants</div>
          <div className="grid grid-cols-2 gap-1">
            {displayUrls.map((imgUrl, index) => (
              <div key={index} className="group relative bg-[#0a0a0a]">
                <div className="relative w-full aspect-square">
                  <Image src={imgUrl} alt={`${prompt} - ${index + 1}`} fill className="object-cover" unoptimized />
                </div>
                <button
                  onClick={() => handleDownload(imgUrl, index)}
                  className="absolute top-2 right-2 p-2 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Download className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-[#0a0a0a]">
          {type === 'image' ? (
            <div className="relative w-full aspect-square">
              <Image src={url} alt={prompt} fill className="object-cover" unoptimized />
            </div>
          ) : (
            <video src={url} controls className="w-full" />
          )}
        </div>
      )}

      {/* Info */}
      <div className="space-y-3">
        <div>
          <div className="text-[#666] text-xs mb-1">Prompt</div>
          <p className="text-sm leading-relaxed">{prompt}</p>
        </div>
        <div className="pt-3 border-t border-[#1a1a1a]">
          <div className="text-[#666] text-xs mb-1">Model</div>
          <p className="text-sm font-medium">{modelName}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-1 pt-2">
        <button
          onClick={() => hasMultipleImages ? handleDownloadAll() : handleDownload()}
          className="py-3 bg-[#141414] hover:bg-[#1a1a1a] transition-colors flex items-center justify-center gap-2"
        >
          <Download className="w-4 h-4 text-[#666]" />
          <span className="text-xs text-[#666]">{hasMultipleImages ? 'ZIP' : 'Save'}</span>
        </button>
        <button
          onClick={onShare}
          className="py-3 bg-[#141414] hover:bg-[#1a1a1a] transition-colors flex items-center justify-center gap-2"
        >
          <Share2 className="w-4 h-4 text-[#666]" />
          <span className="text-xs text-[#666]">Share</span>
        </button>
      </div>
    </div>
  );
}
