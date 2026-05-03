// app/api/upload/route.js
// Handles image file uploads — saves them to public/images/
import { NextResponse } from 'next/server';
import { verifyApiToken } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

export async function POST(request) {
  const user = verifyApiToken(request);
  if (!user || user.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, WebP, and GIF images are allowed' }, { status: 400 });
    }

    // Max 5MB
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File size must be under 5MB' }, { status: 400 });
    }

    // Generate unique filename
    const ext = file.type === 'image/jpeg' ? 'jpg'
               : file.type === 'image/png' ? 'png'
               : file.type === 'image/webp' ? 'webp'
               : file.type === 'image/gif' ? 'gif' : 'jpg';

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^.]+$/, '');
    const filename = `${safeName}_${Date.now()}.${ext}`;

    // Save to public/images/
    const imagesDir = path.join(process.cwd(), 'public', 'images');
    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    fs.writeFileSync(path.join(imagesDir, filename), buffer);

    const url = `/images/${filename}`;
    return NextResponse.json({ url }, { status: 201 });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
