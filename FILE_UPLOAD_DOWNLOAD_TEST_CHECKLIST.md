# File Upload/Download Test Checklist

## Summary of Fixes Applied
1. ✅ **Fixed video resource type bug** in `src/app/api/lessons/[id]/route.ts` - Videos now upload as `'video'` instead of `'image'`
2. ✅ **Fixed quiz update bug** in `src/app/api/teacher/quizzes/[id]/route.ts` - Added missing `wasPublished` variable declaration

---

## TEACHER FILE OPERATIONS

### 1. Course Creation
- [ ] Create new course with thumbnail (JPG/PNG/WEBP, max 5MB)
  - [ ] Thumbnail uploads successfully
  - [ ] Thumbnail displays in course card
  - [ ] Thumbnail persists after page refresh
- [ ] Create course with syllabus file (PDF/PPT/PPTX, max 20MB)
  - [ ] Single syllabus uploads successfully
  - [ ] Syllabus URL stored correctly
  - [ ] Syllabus accessible from course details
- [ ] Create course with multiple syllabus materials
  - [ ] Multiple files upload successfully
  - [ ] Each material has correct label
  - [ ] All materials accessible from course page

### 2. Lesson Creation/Update
- [ ] Create lesson with video upload (MP4/MKV/AVI/MOV/WEBM, max 500MB)
  - [ ] Video uploads successfully
  - [ ] Video plays in lesson viewer
  - [ ] Video persists after page refresh
- [ ] Create lesson with supporting files (PDF/PPT/DOCX, max 500MB)
  - [ ] Supporting files upload successfully
  - [ ] Files appear in lesson materials list
  - [ ] Files downloadable from lesson page
- [ ] Update existing lesson with new video
  - [ ] New video replaces old video
  - [ ] Old video URL no longer used
- [ ] Update existing lesson with new supporting files
  - [ ] New files added to existing files
  - [ ] Can remove individual files
  - [ ] Can clear all files
- [ ] Create lesson with YouTube video
  - [ ] YouTube URL accepted
  - [ ] Video embeds correctly
  - [ ] No file upload occurs

### 3. Assignment Creation/Update
- [ ] Create assignment with file attachments (any format, max 20MB per file)
  - [ ] Multiple files upload successfully
  - [ ] Files appear in assignment details
  - [ ] Files downloadable by students
- [ ] Update assignment with new files
  - [ ] New files added to existing files
  - [ ] Can remove individual files
- [ ] Create assignment without files
  - [ ] Assignment creates successfully
  - [ ] Students can still submit

### 4. Quiz Creation/Update
- [ ] Create quiz (text-based questions only)
  - [ ] Quiz creates successfully
  - [ ] No file upload option available (expected)
- [ ] Update quiz and publish
  - [ ] Quiz publishes successfully
  - [ ] Notifications sent to enrolled students
  - [ ] Students can access quiz

---

## STUDENT FILE OPERATIONS

### 1. Assignment Submission
- [ ] Submit assignment with file attachments (any format, max 20MB per file)
  - [ ] Multiple files upload successfully
  - [ ] Submission created with files
  - [ ] Teacher receives notification
  - [ ] Files visible to teacher in grading view
- [ ] Submit assignment with text only
  - [ ] Submission creates successfully
  - [ ] Text content saved correctly
- [ ] Submit assignment with text + files
  - [ ] Both text and files saved
  - [ ] Both visible in submission details
- [ ] Resubmit assignment (if allowed)
  - [ ] New submission replaces old one
  - [ ] Files updated correctly

### 2. Quiz Attempts
- [ ] Take quiz (text-based answers only)
  - [ ] Quiz loads successfully
  - [ ] Answers submit successfully
  - [ ] Score calculated correctly
  - [ ] No file upload occurs (expected)

### 3. File Downloads
- [ ] Download course syllabus
  - [ ] File downloads with correct name
  - [ ] File opens correctly
- [ ] Download lesson supporting files
  - [ ] Files download with correct names
  - [ ] Files open correctly
- [ ] Download assignment files
  - [ ] Files download with correct names
  - [ ] Files open correctly
- [ ] Download submission files (teacher view)
  - [ ] Files download with correct names
  - [ ] Files open correctly

### 4. File Previews
- [ ] Preview PDF files
  - [ ] PDFs display in iframe
  - [ ] Can open in new tab
- [ ] Preview other file types
  - [ ] Shows "Preview not available" message
  - [ ] Download button available
  - [ ] Download works correctly

---

## CROSS-FUNCTIONAL TESTS

### 1. File Validation
- [ ] Upload file exceeding size limit
  - [ ] Error message displayed
  - [ ] File not uploaded
- [ ] Upload unsupported file type
  - [ ] Error message displayed
  - [ ] File not uploaded
- [ ] Upload valid file
  - [ ] File uploads successfully
  - [ ] No error messages

### 2. File Persistence
- [ ] Upload file and refresh page
  - [ ] File still present
  - [ ] URL unchanged
- [ ] Upload file and navigate away
  - [ ] File persists when returning
  - [ ] URL unchanged
- [ ] Delete course/lesson/assignment with files
  - [ ] Record deleted from database
  - [ ] Files no longer accessible (expected behavior)

### 3. Error Handling
- [ ] Network error during upload
  - [ ] Error message displayed
  - [ ] Can retry upload
- [ ] Server error during upload
  - [ ] Error message displayed
  - [ ] Can retry upload
- [ ] Invalid file format
  - [ ] Clear error message
  - [ ] User can select different file

### 4. Performance
- [ ] Upload large file (close to limit)
  - [ ] Upload completes successfully
  - [ ] No timeout errors
  - [ ] Progress indicator shows (if implemented)
- [ ] Download large file
  - [ ] Download completes successfully
  - [ ] File integrity maintained

---

## STORAGE BACKEND TESTS

### 1. Cloudinary Integration
- [ ] Verify Cloudinary credentials configured
  - [ ] `CLOUDINARY_CLOUD_NAME` set
  - [ ] `CLOUDINARY_API_KEY` set
  - [ ] `CLOUDINARY_API_SECRET` set
- [ ] Upload file to Cloudinary
  - [ ] File appears in Cloudinary dashboard
  - [ ] Correct folder structure (course-lessons, assignments, etc.)
  - [ ] Secure URL returned
- [ ] Verify resource types
  - [ ] Videos uploaded as `video` resource type
  - [ ] Images uploaded as `image` resource type
  - [ ] Documents uploaded as `raw` resource type

### 2. Local Upload Fallback (if enabled)
- [ ] Set `USE_LOCAL_UPLOADS=true`
- [ ] Upload file
  - [ ] File saved to `public/uploads/{folder}/`
  - [ ] Correct folder structure maintained
  - [ ] URL returns `/uploads/{folder}/{filename}`
- [ ] Download file
  - [ ] File accessible via local URL
  - [ ] File content correct

---

## EDGE CASES

- [ ] Upload file with special characters in name
  - [ ] File uploads successfully
  - [ ] Filename sanitized correctly
- [ ] Upload multiple files simultaneously
  - [ ] All files upload successfully
  - [ ] No race conditions
- [ ] Upload file with no extension
  - [ ] File uploads successfully
  - [ ] Extension inferred correctly
- [ ] Upload file with multiple dots in name (e.g., `document.final.pdf`)
  - [ ] File uploads successfully
  - [ ] Extension detected correctly
- [ ] Delete file and immediately re-upload
  - [ ] New file uploads successfully
  - [ ] No conflicts with old file

---

## KNOWN LIMITATIONS

1. **No file deletion from Cloudinary** - When records are deleted, files remain in Cloudinary storage (orphaned)
2. **No dedicated download endpoints** - Files served as direct URLs without access control
3. **No file scanning** - No virus/malware scanning before storage
4. **No file preview/streaming** - Relies on browser's native handling
5. **No file size limits documentation** - Limits vary by operation type

---

## TEST EXECUTION NOTES

**Date Tested:** _______________
**Tester Name:** _______________
**Environment:** ☐ Local Dev | ☐ Staging | ☐ Production

**Issues Found:**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Overall Status:** ☐ PASS | ☐ FAIL | ☐ PARTIAL

**Comments:**
_______________________________________________
_______________________________________________
