"use client";

import { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, useRouter } from 'next/navigation';

interface Comment {
  id: number;
  content: string;
  created_at: string;
}

interface Post {
  id: number;
  image_url: string;
  original_description: string;
  revised_description: string;
  comments: Comment[];
}

export default function PostDetail() {
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modResult, setModResult] = useState<any>(null);

  useEffect(() => {
    if (params.id) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      axios.get(`${apiUrl}/posts/${params.id}`)
        .then(res => setPost(res.data))
        .catch(err => console.error(err));
    }
  }, [params.id]);

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    setLoading(true);
    setError('');
    setModResult(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
      const res = await axios.post(`${apiUrl}/posts/${params.id}/comments`, {
        content: comment
      });

      const data = res.data;
      if (data.moderation.status === 'REJECTED') {
        setModResult(data.moderation);
      } else {
        // Automatically add to list since it's approved
        setPost(prev => prev ? {
          ...prev, 
          comments: [data.comment, ...prev.comments]
        } : null);
        setComment('');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to submit comment.');
    }
    setLoading(false);
  };

  if (!post) return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8 flex flex-col md:flex-row gap-8 mt-10 bg-white rounded-3xl shadow-lg border border-gray-100">
      <div className="w-full md:w-1/2">
        <button onClick={() => router.back()} className="mb-4 text-gray-500 hover:text-gray-800 flex items-center font-semibold text-sm">
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Back
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={post.image_url} alt="Pin" className="w-full h-auto rounded-2xl object-cover shadow-sm" />
      </div>
      
      <div className="w-full md:w-1/2 flex flex-col">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Description</h1>
        <p className="text-gray-700 text-lg">{post.revised_description || post.original_description}</p>
        
        <hr className="my-6 border-gray-100" />
        
        <h2 className="text-xl font-bold text-gray-900 mb-4">Comments</h2>
        
        <div className="flex-grow overflow-y-auto max-h-64 mb-4 pr-2 space-y-3">
          {post.comments && post.comments.length > 0 ? (
            post.comments.map(c => (
              <div key={c.id} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-800">{c.content}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-sm italic">No comments yet. Be the first to comment!</p>
          )}
        </div>

        <div className="mt-auto">
          {modResult && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
              <h3 className="text-red-700 font-semibold text-sm mb-1">Comment Blocked</h3>
              <p className="text-red-600 text-sm mb-2">Reason: {modResult.reason}</p>
              {modResult.suggested_text && (
                <div className="bg-white p-2 rounded border border-red-100 text-sm">
                  <span className="font-semibold text-gray-700">Suggestion:</span> {modResult.suggested_text}
                </div>
              )}
            </div>
          )}
          
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
          
          <form onSubmit={submitComment} className="flex gap-2">
            <input 
              type="text" 
              className="flex-grow p-3 bg-gray-100 border-transparent focus:bg-white focus:border-red-500 focus:ring-2 focus:ring-red-200 rounded-xl outline-none transition-all" 
              placeholder="Add a comment" 
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={loading}
              className="bg-red-600 text-white px-5 py-3 rounded-xl font-semibold hover:bg-red-700 disabled:bg-gray-300 transition-colors"
            >
              {loading ? '...' : 'Post'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
