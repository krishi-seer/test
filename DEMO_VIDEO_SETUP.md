# 🎥 Demo Video Upload Instructions

## Where to Upload Your Demo Video

You have **3 main options** for hosting your demo video:

### 📺 **Option 1: YouTube (Recommended)**
**Best for**: Easy sharing, no storage limits, professional appearance

1. **Upload to YouTube**:
   - Go to [YouTube Studio](https://studio.youtube.com)
   - Click "Create" → "Upload Video"
   - Upload your demo video
   - Set visibility to "Public" or "Unlisted"
   - Copy the video ID from the URL

2. **Update the Demo Page**:
   - Edit `app/demo/page.tsx`
   - Replace `YOUR_YOUTUBE_VIDEO_ID` with your actual video ID
   - Uncomment the YouTube embed section (lines with YouTube iframe)
   - Comment out the direct video section

**Example**:
```javascript
const youtubeId = "dQw4w9WgXcQ"; // Your actual YouTube video ID
```

---

### 🎬 **Option 2: Direct File Upload**
**Best for**: Full control, no external dependencies

1. **Add video to your project**:
   ```
   public/
   ├── demo-video.mp4        # Your main video file
   ├── demo-video.webm       # Optional: WebM format for better compression
   └── demo-thumbnail.jpg    # Video thumbnail image
   ```

2. **Update the Demo Page**:
   - Edit `app/demo/page.tsx`
   - Update the `videoUrl` variable:
   ```javascript
   const videoUrl = "/demo-video.mp4";
   ```

3. **File Requirements**:
   - **Format**: MP4 (H.264) recommended
   - **Size**: Keep under 100MB for web performance
   - **Resolution**: 1920x1080 or 1280x720 recommended

---

### 🌐 **Option 3: Vimeo**
**Best for**: Ad-free professional appearance, better privacy controls

1. **Upload to Vimeo**:
   - Go to [Vimeo](https://vimeo.com)
   - Upload your video
   - Copy the video ID from the URL

2. **Update the Demo Page**:
   - Edit `app/demo/page.tsx`
   - Replace `YOUR_VIMEO_VIDEO_ID` with your actual video ID
   - Uncomment the Vimeo embed section
   - Comment out the direct video section

---

## 🛠 **Current Setup**

Your demo page is ready at: **`/demo`**

**Navigation added to**:
- ✅ Side menu (with 🎥 icon and "NEW" badge)
- ✅ Bottom navigation (with video icon and red pulse)

**Features included**:
- 🖥️ Full-screen video player
- 📱 Responsive design
- 🎯 Demo highlights section
- 📊 Key benefits showcase
- 🔗 Call-to-action buttons

---

## 🚀 **Quick Start (YouTube)**

1. Upload your video to YouTube
2. Copy the video ID from the URL: `https://youtube.com/watch?v=VIDEO_ID_HERE`
3. Edit `app/demo/page.tsx`:
   ```javascript
   // Replace this line:
   const youtubeId = "YOUR_YOUTUBE_VIDEO_ID";
   
   // With your actual video ID:
   const youtubeId = "your_actual_video_id";
   ```
4. Uncomment the YouTube embed section (remove `/*` and `*/`)
5. Comment out the direct video section (add `/*` and `*/`)

---

## 📝 **Alternative: Cloud Storage**

If you want to host the video file elsewhere:

### **Google Drive**:
1. Upload to Google Drive
2. Set sharing to "Anyone with the link"
3. Get the direct download link

### **Dropbox**:
1. Upload to Dropbox
2. Get the direct link
3. Replace `dl=0` with `dl=1` in the URL

### **AWS S3 / Cloudflare**:
1. Upload to your cloud storage
2. Get the public URL
3. Update the `videoUrl` in the demo page

---

## 🎨 **Customization**

You can customize the demo page by editing `app/demo/page.tsx`:

- **Video title and description**
- **Demo highlights list**
- **Key benefits cards**
- **Call-to-action buttons**
- **Color scheme and styling**

The page is fully responsive and will work perfectly on all devices! 📱💻

---

**Need help?** Check the contact page or reach out through the platform! 🤝