'use client';

import React, { useState, useRef } from 'react';
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export default function CreatePin() {
  const router = useRouter();
  const [imgSrc, setImgSrc] = useState('');
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [description, setDescription] = useState('');
  
  const [moderationResult, setModerationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [postData, setPostData] = useState<any>(null);

  function onSelectFile(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined); // Makes crop preview update between images.
      const reader = new FileReader();
      reader.addEventListener('load', () =>
        setImgSrc(reader.result?.toString() || '')
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  }

  function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
    const { width, height } = e.currentTarget;
    // Default crop
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height
    );
    setCrop(crop);
  }

  async function getCroppedImg(image: HTMLImageElement, crop: PixelCrop): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    canvas.width = crop.width;
    canvas.height = crop.height;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(
        image,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height
      );
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) throw new Error('Canvas is empty');
        resolve(blob);
      }, 'image/jpeg');
    });
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imgRef.current || !completedCrop) return;

    setLoading(true);
    try {
      const croppedBlob = await getCroppedImg(imgRef.current, completedCrop);
      const formData = new FormData();
      formData.append('image', croppedBlob, 'pin.jpg');
      formData.append('description', description);

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await axios.post(`${apiUrl}/posts`, formData);
      setModerationResult(res.data.moderation);
      setPostData(res.data.post);
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || err.message || 'Unknown error';
      alert(`Error submitting post: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSuggestion = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      await axios.post(`${apiUrl}/posts/${postData.id}/accept`);
      router.push('/');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm border border-gray-100 p-8 mt-4">
      <h1 className="text-3xl font-bold mb-6">Create Pin</h1>
      
      {!moderationResult ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Upload Image</label>
            <input type="file" accept="image/*" onChange={onSelectFile} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
          </div>

          {imgSrc && (
            <div className="mt-4 border rounded bg-gray-50 flex justify-center p-4">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={4/5}
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={imgSrc}
                  onLoad={onImageLoad}
                  style={{ maxHeight: '400px' }}
                />
              </ReactCrop>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea
              className="w-full px-4 py-2 border rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200 resize-none h-32"
              placeholder="Tell everyone what your Pin is about"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading || !completedCrop}
              className="px-6 py-2 bg-red-600 text-white font-bold rounded-full hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? 'Analyzing...' : 'Publish'}
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Moderation Result</h2>
          
          <div className={`p-4 rounded-xl border ${moderationResult.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
            <p className="font-semibold mb-2">Status: <span className="uppercase">{moderationResult.status}</span></p>
            {moderationResult.reason && <p className="text-sm mb-2"><strong>Reason:</strong> {moderationResult.reason}</p>}
            
            {moderationResult.status === 'rejected' && moderationResult.suggested_text && (
              <div className="mt-4 p-4 bg-white rounded border">
                <p className="text-sm text-gray-500 mb-1">AI Suggestion for Description:</p>
                <p className="font-medium">"{moderationResult.suggested_text}"</p>
              </div>
            )}
            {moderationResult.status === 'pending' && (
              <div className="mt-4 p-4 bg-white rounded border">
                <p className="text-sm text-red-500 mb-1">Error processing request.</p>
                <p className="font-medium">The AI is currently unavailable or your API key is out of quota. Please try again later.</p>
              </div>
            )}
          </div>

          <div className="flex gap-4 justify-end mt-6">
            <button 
              onClick={() => { setModerationResult(null); setPostData(null); }}
              className="px-6 py-2 bg-gray-200 font-bold rounded-full hover:bg-gray-300"
            >
              Back to Edit
            </button>
            {moderationResult.status === 'approved' ? (
              <button 
                onClick={() => router.push('/')}
                className="px-6 py-2 bg-red-600 text-white font-bold rounded-full hover:bg-red-700"
              >
                Go to Feed
              </button>
            ) : moderationResult.status === 'rejected' && moderationResult.suggested_text ? (
              <button 
                onClick={handleAcceptSuggestion}
                disabled={loading}
                className="px-6 py-2 bg-red-600 text-white font-bold rounded-full hover:bg-red-700"
              >
                {loading ? 'Saving...' : 'Accept Suggestion & Publish'}
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
