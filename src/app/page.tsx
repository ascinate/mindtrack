'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import Masonry from 'react-masonry-css';
import Link from 'next/link';

interface Post {
  id: number;
  image_path: string;
  image_url: string;
  original_description: string;
  revised_description: string | null;
  status: string;
}

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    axios.get(`${apiUrl}/posts`)
      .then(res => setPosts(res.data))
      .catch(err => console.error(err));
  }, []);

  const breakpointColumnsObj = {
    default: 4,
    1100: 3,
    700: 2,
    500: 1
  };

  return (
    <div>
      <Masonry
        breakpointCols={breakpointColumnsObj}
        className="flex w-auto -ml-4"
        columnClassName="pl-4 bg-clip-padding"
      >
        {posts.map(post => (
          <div key={post.id} className="mb-4 break-inside-avoid">
            <Link href={`/post/${post.id}`}>
              <div className="relative group rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100 hover:shadow-md transition">
                <img 
                  src={post.image_url} 
                  alt="Pin" 
                  className="w-full object-cover"
                />
                <div className="p-3">
                  <p className="text-sm font-medium text-gray-800">
                    {post.revised_description || post.original_description}
                  </p>
                </div>
              </div>
            </Link>
          </div>
        ))}
      </Masonry>
      
      {posts.length === 0 && (
        <div className="text-center text-gray-500 mt-20">
          <p>No posts yet. Create a pin!</p>
        </div>
      )}
    </div>
  );
}
